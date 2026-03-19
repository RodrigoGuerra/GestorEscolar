import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
import { Class } from './entities/class.entity';

describe('ClassesService', () => {
  let service: ClassesService;
  let mockRepo: any;
  let mockTenantRepo: any;

  const mockClass = {
    id: 'cls-1',
    name: 'Turma A',
    schoolId: 'school-1',
    students: [],
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    mockTenantRepo = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  describe('create', () => {
    it('should create and save a class', async () => {
      const dto = { name: 'Turma A', schoolId: 'school-1' };
      const created = { ...dto, id: 'cls-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(mockTenantRepo.getRepository).toHaveBeenCalledWith(Class);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return all classes', async () => {
      mockRepo.find.mockResolvedValue([mockClass]);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['school', 'students'] });
      expect(result).toEqual([mockClass]);
    });
  });

  describe('findOne', () => {
    it('should return the class when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockClass);

      const result = await service.findOne('cls-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'cls-1' },
        relations: ['school', 'students'],
      });
      expect(result).toEqual(mockClass);
    });

    it('should throw NotFoundException when class does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Class with ID nonexistent not found',
      );
    });
  });

  describe('update', () => {
    it('should update an existing class', async () => {
      const dto = { name: 'Turma B' };
      const updatedClass = { ...mockClass, name: 'Turma B' };
      mockRepo.findOne
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(updatedClass);
      mockRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('cls-1', dto as any);

      expect(mockRepo.update).toHaveBeenCalledWith('cls-1', dto);
      expect(result).toEqual(updatedClass);
    });
  });

  describe('assignStudent', () => {
    it('should add student to class and save', async () => {
      const studentId = 'stu-1';
      const classWithNoStudents = { ...mockClass, students: [] };
      const classWithStudent = { ...mockClass, students: [{ id: studentId }] };
      
      mockRepo.findOne.mockResolvedValue(classWithNoStudents);
      mockRepo.save.mockResolvedValue(classWithStudent);

      const result = await service.assignStudent('cls-1', studentId);

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.students).toContainEqual(expect.objectContaining({ id: studentId }));
    });

    it('should throw ConflictException if student already assigned', async () => {
      const studentId = 'stu-1';
      const classWithStudent = { ...mockClass, students: [{ id: studentId }] };
      mockRepo.findOne.mockResolvedValue(classWithStudent);

      await expect(service.assignStudent('cls-1', studentId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
