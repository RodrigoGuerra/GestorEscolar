import { Injectable, NotFoundException } from '@nestjs/common';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class StudentsService {
  // F16: use TenantRepositoryService so queries run on the tenant-scoped
  // QueryRunner connection (where SET search_path was already applied)
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const repo = this.tenantRepo.getRepository(Student);
    const student = repo.create(createStudentDto);
    return repo.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.tenantRepo
      .getRepository(Student)
      .find({ relations: ['school', 'classes'] });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.tenantRepo.getRepository(Student).findOne({
      where: { id },
      relations: ['school', 'classes'],
    });
    if (!student) throw new NotFoundException(`Student with ID ${id} not found`);
    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const repo = this.tenantRepo.getRepository(Student);
    const student = await this.findOne(id);
    return repo.save(Object.assign(student, updateStudentDto));
  }

  async remove(id: string): Promise<void> {
    const student = await this.findOne(id);
    await this.tenantRepo.getRepository(Student).remove(student);
  }

  async assignToClass(studentId: string, _classId: string): Promise<Student> {
    return this.findOne(studentId);
  }
}
