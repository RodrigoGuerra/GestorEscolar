import { Injectable, NotFoundException } from '@nestjs/common';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const repo = this.tenantRepo.getRepository(Employee);
    const employee = repo.create(createEmployeeDto);
    return repo.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.tenantRepo
      .getRepository(Employee)
      .find({ relations: ['bankDetails', 'address'] });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.tenantRepo.getRepository(Employee).findOne({
      where: { id },
      relations: ['bankDetails', 'address'],
    });
    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const repo = this.tenantRepo.getRepository(Employee);
    const employee = await this.findOne(id);

    if (updateEmployeeDto.address && employee.address) {
      Object.assign(employee.address, updateEmployeeDto.address);
      delete updateEmployeeDto.address;
    }
    if (updateEmployeeDto.bankDetails && employee.bankDetails) {
      Object.assign(employee.bankDetails, updateEmployeeDto.bankDetails);
      delete updateEmployeeDto.bankDetails;
    }

    Object.assign(employee, updateEmployeeDto);
    return repo.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.tenantRepo.getRepository(Employee).remove(employee);
  }
}
