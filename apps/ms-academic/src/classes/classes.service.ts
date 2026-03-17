import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Class } from './entities/class.entity';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class ClassesService {
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  create(createClassDto: CreateClassDto) {
    const repo = this.tenantRepo.getRepository(Class);
    return repo.save(repo.create(createClassDto));
  }

  findAll() {
    return this.tenantRepo
      .getRepository(Class)
      .find({ relations: ['school', 'students'] });
  }

  async findOne(id: string) {
    const entity = await this.tenantRepo.getRepository(Class).findOne({
      where: { id },
      relations: ['school', 'students'],
    });
    if (!entity) throw new NotFoundException(`Class with ID ${id} not found`);
    return entity;
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    const repo = this.tenantRepo.getRepository(Class);
    await this.findOne(id);
    await repo.update(id, updateClassDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.tenantRepo.getRepository(Class).remove(entity);
    return { deleted: true };
  }

  async assignStudent(classId: string, studentId: string) {
    const repo = this.tenantRepo.getRepository(Class);
    const classEntity = await repo.findOne({
      where: { id: classId },
      relations: ['students'],
    });
    if (!classEntity) throw new NotFoundException('Class not found');
    if (classEntity.students.some((s) => s.id === studentId)) {
      throw new ConflictException('Student already assigned to this class');
    }
    classEntity.students.push({ id: studentId } as any);
    return repo.save(classEntity);
  }
}
