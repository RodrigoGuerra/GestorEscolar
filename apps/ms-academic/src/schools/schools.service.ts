import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { Class } from '../classes/entities/class.entity';
import { CreateSchoolDto, UpdateSchoolDto } from './dto/school.dto';

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
  ) {}

  async create(createSchoolDto: CreateSchoolDto): Promise<School> {
    // Check for duplicates
    const existing = await this.schoolsRepository.findOne({
      where: [{ name: createSchoolDto.name }, { cnpj: createSchoolDto.cnpj }],
    });
    if (existing) {
      throw new ConflictException(
        'Já existe uma unidade com este nome ou CNPJ',
      );
    }

    const count = await this.schoolsRepository.count();
    const isFirstSchool = count === 0;

    if (createSchoolDto.isMatrix || isFirstSchool) {
      // Force all others to be filiais and point to nothing
      await this.schoolsRepository.update(
        { isMatrix: true },
        { isMatrix: false, parentSchoolId: null },
      );

      const school = this.schoolsRepository.create({
        ...createSchoolDto,
        isMatrix: true,
        parentSchoolId: null,
      });
      const saved = await this.schoolsRepository.save(school);

      // Update all others to point to this new matrix
      await this.schoolsRepository
        .createQueryBuilder()
        .update(School)
        .set({ parentSchoolId: saved.id })
        .where('id != :id', { id: saved.id })
        .execute();

      return saved;
    } else {
      const matrix = await this.schoolsRepository.findOne({
        where: { isMatrix: true },
      });
      const school = this.schoolsRepository.create({
        ...createSchoolDto,
        parentSchoolId: matrix?.id || null,
      });
      return this.schoolsRepository.save(school);
    }
  }

  async findAll(): Promise<School[]> {
    return this.schoolsRepository.find({ relations: ['branches'] });
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolsRepository.findOne({
      where: { id },
      relations: ['branches', 'parentSchool'],
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    return school;
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<School> {
    const school = await this.findOne(id);

    // Check for duplicates excluding self
    if (updateSchoolDto.name || updateSchoolDto.cnpj) {
      const existing = await this.schoolsRepository
        .createQueryBuilder('school')
        .where('school.id != :id', { id })
        .andWhere('(school.name = :name OR school.cnpj = :cnpj)', {
          name: updateSchoolDto.name || school.name,
          cnpj: updateSchoolDto.cnpj || school.cnpj,
        })
        .getOne();

      if (existing) {
        throw new ConflictException(
          'Já existe outra unidade com este nome ou CNPJ',
        );
      }
    }

    if (updateSchoolDto.isMatrix && !school.isMatrix) {
      // Transitioning to Matrix
      await this.schoolsRepository.update(
        { isMatrix: true },
        { isMatrix: false, parentSchoolId: null },
      );

      Object.assign(school, {
        ...updateSchoolDto,
        isMatrix: true,
        parentSchoolId: null,
      });
      const saved = await this.schoolsRepository.save(school);

      // Update all others to point to this new matrix
      await this.schoolsRepository
        .createQueryBuilder()
        .update(School)
        .set({ parentSchoolId: saved.id })
        .where('id != :id', { id: saved.id })
        .execute();

      return saved;
    }

    // If it's a filial being updated and we have a matrix, ensure it points to it
    if (updateSchoolDto.isMatrix === false) {
      const matrix = await this.schoolsRepository.findOne({
        where: { isMatrix: true },
      });
      // Use the matrix found or null
      Object.assign(school, {
        ...updateSchoolDto,
        parentSchoolId: matrix?.id || null,
      });
    } else {
      Object.assign(school, updateSchoolDto);
    }

    return this.schoolsRepository.save(school);
  }

  async remove(id: string): Promise<void> {
    const school = await this.findOne(id);

    if (school.isMatrix) {
      const count = await this.schoolsRepository.count();
      if (count > 1) {
        throw new BadRequestException(
          'Não é possível excluir a unidade matriz enquanto houverem filiais. Transforme uma filial em matriz antes da exclusão.',
        );
      }
    }

    await this.schoolsRepository.remove(school);
  }

  async getSchoolMetrics(schoolId: string) {
    const classesCount = await this.classesRepository.count({
      where: { schoolId },
    });

    // Since there's no Student entity yet in ms-academic, we could either:
    // 1. Fetch from ms-identity (complex cross-service call)
    // 2. Mock for now but with the right structure
    // 3. Check if there are pupils in classes (not yet implemented)

    return {
      activeStudents: 0, // Placeholder until students are implemented
      classesCount,
      eventsCount: 0, // Placeholder
    };
  }
}
