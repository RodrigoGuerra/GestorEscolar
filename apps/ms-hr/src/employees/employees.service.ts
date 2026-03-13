import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const employee = this.employeesRepository.create(createEmployeeDto);
    return this.employeesRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeesRepository.find({ relations: ['bankDetails'] });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({
      where: { id },
      relations: ['bankDetails'],
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeesRepository.remove(employee);
  }
}
