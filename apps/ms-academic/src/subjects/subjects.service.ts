import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { SchoolsService } from '../schools/schools.service';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    private schoolsService: SchoolsService,
  ) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const school = await this.schoolsService.findOne(createSubjectDto.matrixId);
    if (!school.isMatrix) {
      throw new ForbiddenException('Only Matrix schools can create subjects');
    }
    const subject = this.subjectsRepository.create(createSubjectDto);
    return this.subjectsRepository.save(subject);
  }

  async findAll(): Promise<Subject[]> {
    return this.subjectsRepository.find();
  }

  async findOne(id: string): Promise<Subject> {
    const subject = await this.subjectsRepository.findOne({ where: { id } });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<Subject> {
    const subject = await this.findOne(id);
    if (updateSubjectDto.matrixId) {
      const school = await this.schoolsService.findOne(updateSubjectDto.matrixId);
      if (!school.isMatrix) {
        throw new ForbiddenException('Subject must be associated with a Matrix school');
      }
    }
    Object.assign(subject, updateSubjectDto);
    return this.subjectsRepository.save(subject);
  }

  async remove(id: string): Promise<void> {
    const subject = await this.findOne(id);
    await this.subjectsRepository.remove(subject);
  }
}
