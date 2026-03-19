import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
import { Employee } from './entities/employee.entity';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let mockRepo: any;
  let mockTenantRepo: any;

  const mockEmployee = {
    id: 'emp-1',
    name: 'João Silva',
    email: 'joao.silva@escola.com',
    role: 'TEACHER',
    address: { street: 'Main St' },
    bankDetails: { bank: 'Bank A' },
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockTenantRepo = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  describe('create', () => {
    it('should create and save an employee', async () => {
      const dto = { name: 'João Silva', email: 'joao.silva@escola.com' };
      const created = { ...dto, id: 'emp-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(mockTenantRepo.getRepository).toHaveBeenCalledWith(Employee);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return all employees with relations', async () => {
      mockRepo.find.mockResolvedValue([mockEmployee]);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['bankDetails', 'address'] });
      expect(result).toEqual([mockEmployee]);
    });
  });

  describe('findOne', () => {
    it('should return the employee when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockEmployee);

      const result = await service.findOne('emp-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        relations: ['bankDetails', 'address'],
      });
      expect(result).toEqual(mockEmployee);
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Employee with ID nonexistent not found',
      );
    });
  });

  describe('update', () => {
    it('should update an existing employee and nested entities', async () => {
      const dto = { 
        name: 'João Updated',
        address: { street: 'New St' },
        bankDetails: { bank: 'Bank B' }
      };
      const updatedEmployee = { 
        ...mockEmployee, 
        name: 'João Updated',
        address: { street: 'New St' },
        bankDetails: { bank: 'Bank B' }
      };
      mockRepo.findOne.mockResolvedValue(mockEmployee);
      mockRepo.save.mockResolvedValue(updatedEmployee);

      const result = await service.update('emp-1', dto as any);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('João Updated');
      expect(result.address.street).toBe('New St');
    });
  });
});
