import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    return this.repository.find({ relations: ['school', 'students'] });
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id }, relations: ['school', 'students'] });
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

  async assignStudent(classId: string, studentId: string) {
    const classEntity = await this.repository.findOne({
      where: { id: classId },
      relations: ['students'],
    });
    if (!classEntity) throw new NotFoundException('Class not found');

    if (classEntity.students.some((s) => s.id === studentId)) {
      throw new ConflictException('Student already assigned to this class');
    }

    // We can't use StudentsService directly here to avoid circular dependency
    // but we can use TypeORM's relation manager or add Student to this repo
    // To keep it simple, we'll just add the student reference
    classEntity.students.push({ id: studentId } as any);
    return this.repository.save(classEntity);
  }
}
