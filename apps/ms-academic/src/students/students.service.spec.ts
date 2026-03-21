import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
import { Student } from './entities/student.entity';

describe('StudentsService', () => {
  let service: StudentsService;
  let mockRepo: any;
  let mockTenantRepo: any;

  const mockStudent: Partial<Student> = {
    id: 'stu-1',
    name: 'Maria Silva',
    email: 'maria.silva@escola.com',
    cpf: '123.456.789-00',
    phone: '11999990000',
    birthDate: new Date('2000-01-15'),
    enrollmentNumber: 'MAT-2024-001',
    enrollmentDate: new Date('2024-02-01'),
    status: 'ACTIVE',
    schools: [{ id: 'school-1' } as any],
    classes: [],
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
        StudentsService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('create', () => {
    it('should create and save a student', async () => {
      const dto = {
        name: 'Maria Silva',
        email: 'maria.silva@escola.com',
        cpf: '123.456.789-00',
        phone: '11999990000',
        birthDate: '2000-01-15',
        enrollmentNumber: 'MAT-2024-001',
      };
      const created = { ...dto, id: 'stu-1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(mockTenantRepo.getRepository).toHaveBeenCalledWith(Student);
      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return all students with school and classes relations', async () => {
      mockRepo.find.mockResolvedValue([mockStudent]);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({
        relations: ['schools', 'classes'],
      });
      expect(result).toEqual([mockStudent]);
    });
  });

  describe('findOne', () => {
    it('should return the student when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudent);

      const result = await service.findOne('stu-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'stu-1' },
        relations: ['schools', 'classes'],
      });
      expect(result).toEqual(mockStudent);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Student with ID nonexistent not found',
      );
    });
  });

  describe('update', () => {
    it('should update an existing student and return the updated entity', async () => {
      const dto = { phone: '11888880000' };
      const updatedStudent = { ...mockStudent, phone: '11888880000' };
      mockRepo.findOne.mockResolvedValue(mockStudent);
      mockRepo.save.mockResolvedValue(updatedStudent);

      const result = await service.update('stu-1', dto as any);

      expect(mockRepo.save).toHaveBeenCalledWith(
        Object.assign(mockStudent, dto),
      );
      expect(result).toEqual(updatedStudent);
    });

    it('should throw NotFoundException when updating non-existent student', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { phone: '11000000000' } as any),
      ).rejects.toThrow('Student with ID bad-id not found');
    });
  });

  describe('remove', () => {
    it('should remove the student', async () => {
      mockRepo.findOne.mockResolvedValue(mockStudent);
      mockRepo.remove.mockResolvedValue(mockStudent);

      await service.remove('stu-1');

      expect(mockTenantRepo.getRepository).toHaveBeenCalledWith(Student);
      expect(mockRepo.remove).toHaveBeenCalledWith(mockStudent);
    });

    it('should throw NotFoundException when removing non-existent student', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(
        'Student with ID bad-id not found',
      );
    });
  });

  describe('assignToClass', () => {
    it('should add the class to student.classes and persist', async () => {
      const mockClass = { id: 'cls-1', name: 'Turma A' };
      const studentWithClass = { ...mockStudent, classes: [mockClass] };

      mockRepo.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(studentWithClass);
      mockRepo.save.mockResolvedValue(studentWithClass);

      const result = await service.assignToClass('stu-1', 'cls-1');

      expect(mockRepo.save).toHaveBeenCalled();
      expect(result.classes).toContainEqual(mockClass);
    });

    it('should throw NotFoundException if student does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.assignToClass('bad-id', 'cls-1')).rejects.toThrow(
        'Student with ID bad-id not found',
      );
    });

    it('should throw NotFoundException if class does not exist', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(null);
      await expect(service.assignToClass('stu-1', 'bad-cls')).rejects.toThrow(
        'Class with ID bad-cls not found',
      );
    });

    it('should not save if student is already enrolled in the class', async () => {
      const mockClass = { id: 'cls-1', name: 'Turma A' };
      const enrolled = { ...mockStudent, classes: [mockClass] };
      mockRepo.findOne
        .mockResolvedValueOnce(enrolled)
        .mockResolvedValueOnce(mockClass)
        .mockResolvedValueOnce(enrolled);

      const result = await service.assignToClass('stu-1', 'cls-1');

      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(result.classes).toHaveLength(1);
    });
  });
});
