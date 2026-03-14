import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly repository: Repository<Grade>,
  ) {}

  create(createGradeDto: CreateGradeDto) {
    const entity = this.repository.create(createGradeDto);
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find({ relations: ['subject'] });
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id }, relations: ['subject'] });
    if (!entity) throw new NotFoundException(`Grade with ID ${id} not found`);
    return entity;
  }

  async update(id: string, updateGradeDto: UpdateGradeDto) {
    await this.findOne(id);
    await this.repository.update(id, updateGradeDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
    return { deleted: true };
  }
}
