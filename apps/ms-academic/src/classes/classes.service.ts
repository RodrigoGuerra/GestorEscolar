import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly repository: Repository<Class>,
  ) {}

  create(createClassDto: CreateClassDto) {
    const entity = this.repository.create(createClassDto);
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find({ relations: ['school'] });
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id }, relations: ['school'] });
    if (!entity) throw new NotFoundException(`Class with ID ${id} not found`);
    return entity;
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    await this.findOne(id);
    await this.repository.update(id, updateClassDto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
    return { deleted: true };
  }
}
