import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { SchoolsService } from '../schools/schools.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly tenantRepo: TenantRepositoryService,
    private readonly schoolsService: SchoolsService,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const repo = this.tenantRepo.getRepository(Subject);

    if (createSubjectDto.matrixId) {
      const school = await this.schoolsService.findOne(createSubjectDto.matrixId);
      if (!school.isMatrix) {
        throw new ForbiddenException('Only Matrix schools can create subjects');
      }
    }

    const nameUpper = createSubjectDto.name.toUpperCase();
    const existing = await repo.findOne({ where: { name: nameUpper } });
    if (existing) {
      throw new ForbiddenException(`Subject with name ${nameUpper} already exists`);
    }

    const subject = repo.create({ ...createSubjectDto, name: nameUpper });
    return repo.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return this.tenantRepo.getRepository(Subject).find();
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.tenantRepo.getRepository(Subject).findOne({ where: { id } });
    if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const repo = this.tenantRepo.getRepository(Subject);
    const subject = await this.findOne(id);

    if (updateSubjectDto.matrixId) {
      const school = await this.schoolsService.findOne(updateSubjectDto.matrixId);
      if (!school.isMatrix) {
        throw new ForbiddenException('Subject must be associated with a Matrix school');
      }
    }

    if (updateSubjectDto.name) {
      const nameUpper = updateSubjectDto.name.toUpperCase();
      const existing = await repo.findOne({ where: { name: nameUpper } });
      if (existing && existing.id !== id) {
        throw new ForbiddenException(`Subject with name ${nameUpper} already exists`);
      }
      updateSubjectDto.name = nameUpper;
    }

    Object.assign(subject, updateSubjectDto);
    return repo.save(subject);
  }

  async remove(id: string): Promise<void> {
    const subject = await this.findOne(id);
    await this.tenantRepo.getRepository(Subject).remove(subject);
  }
}
