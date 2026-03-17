import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { School } from './entities/school.entity';
import { Class } from '../classes/entities/class.entity';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class SchoolsService {
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  async create(createSchoolDto: CreateSchoolDto): Promise<School> {
    const schoolRepo = this.tenantRepo.getRepository(School);

    const existing = await schoolRepo.findOne({
      where: [{ name: createSchoolDto.name }, { cnpj: createSchoolDto.cnpj }],
    });
    if (existing) {
      throw new ConflictException('Já existe uma unidade com este nome ou CNPJ');
    }

    const count = await schoolRepo.count();
    const isFirstSchool = count === 0;

    if (createSchoolDto.isMatrix || isFirstSchool) {
      await schoolRepo
        .createQueryBuilder()
        .update(School)
        .set({ isMatrix: false, parentSchoolId: null })
        .execute();

      const school = schoolRepo.create({
        ...createSchoolDto,
        isMatrix: true,
        parentSchoolId: null,
      });
      const saved = await schoolRepo.save(school);

      await schoolRepo
        .createQueryBuilder()
        .update(School)
        .set({ parentSchoolId: saved.id })
        .where('id != :id', { id: saved.id })
        .execute();

      return saved;
    } else {
      const matrix = await schoolRepo.findOne({ where: { isMatrix: true } });
      const school = schoolRepo.create({
        ...createSchoolDto,
        parentSchoolId: matrix?.id || null,
      });
      return schoolRepo.save(school);
    }
  }

  async findAll(): Promise<School[]> {
    return this.tenantRepo.getRepository(School).find({ relations: ['branches'] });
  }

  async findOne(id: string): Promise<School> {
    const school = await this.tenantRepo.getRepository(School).findOne({
      where: { id },
      relations: ['branches', 'parentSchool'],
    });
    if (!school) throw new NotFoundException(`School with ID ${id} not found`);
    return school;
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const schoolRepo = this.tenantRepo.getRepository(School);
    const school = await this.findOne(id);

    if (updateSchoolDto.name || updateSchoolDto.cnpj) {
      const existing = await schoolRepo
        .createQueryBuilder('school')
        .where('school.id != :id', { id })
        .andWhere('(school.name = :name OR school.cnpj = :cnpj)', {
          name: updateSchoolDto.name || school.name,
          cnpj: updateSchoolDto.cnpj || school.cnpj,
        })
        .getOne();

      if (existing) {
        throw new ConflictException('Já existe outra unidade com este nome ou CNPJ');
      }
    }

    if (updateSchoolDto.isMatrix && !school.isMatrix) {
      await schoolRepo
        .createQueryBuilder()
        .update(School)
        .set({ isMatrix: false, parentSchoolId: null })
        .execute();

      Object.assign(school, { ...updateSchoolDto, isMatrix: true, parentSchoolId: null });
      const saved = await schoolRepo.save(school);

      await schoolRepo
        .createQueryBuilder()
        .update(School)
        .set({ parentSchoolId: saved.id })
        .where('id != :id', { id: saved.id })
        .execute();

      return saved;
    }

    if (updateSchoolDto.isMatrix === false) {
      const matrix = await schoolRepo.findOne({ where: { isMatrix: true } });
      Object.assign(school, { ...updateSchoolDto, parentSchoolId: matrix?.id || null });
    } else {
      Object.assign(school, updateSchoolDto);
    }

    return schoolRepo.save(school);
  }

  async remove(id: string): Promise<void> {
    const schoolRepo = this.tenantRepo.getRepository(School);
    const school = await this.findOne(id);

    if (school.isMatrix) {
      const count = await schoolRepo.count();
      if (count > 1) {
        throw new BadRequestException(
          'Não é possível excluir a unidade matriz enquanto houverem filiais.',
        );
      }
    }

    await schoolRepo.remove(school);
  }

  async getSchoolMetrics(schoolId: string) {
    const classesCount = await this.tenantRepo
      .getRepository(Class)
      .count({ where: { schoolId } });

    return {
      activeStudents: 0,
      classesCount,
      eventsCount: 0,
    };
  }
}
