import { Injectable, NotFoundException } from '@nestjs/common';
import { Grade } from './entities/grade.entity';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class GradesService {
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  create(createGradeDto: CreateGradeDto) {
    const repo = this.tenantRepo.getRepository(Grade);
    return repo.save(repo.create(createGradeDto));
  }

  findAll() {
    return this.tenantRepo.getRepository(Grade).find({ relations: ['subject'] });
  }

  async findOne(id: string) {
    const entity = await this.tenantRepo.getRepository(Grade).findOne({
      where: { id },
      relations: ['subject'],
    });
    if (!entity) throw new NotFoundException(`Grade with ID ${id} not found`);
    return entity;
  }

  async update(id: string, updateGradeDto: UpdateGradeDto) {
    const repo = this.tenantRepo.getRepository(Grade);
    await this.findOne(id);
    await repo.update(id, updateGradeDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.tenantRepo.getRepository(Grade).remove(entity);
    return { deleted: true };
  }
}
