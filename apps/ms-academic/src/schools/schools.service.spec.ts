import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

describe('SchoolsService — student association', () => {
  let service: SchoolsService;
  let mockRepo: any;
  let mockTenantRepo: any;

  const mockSchool = {
    id: 'school-1',
    name: 'Escola A',
    cnpj: '00.000.000/0001-00',
    isMatrix: true,
    students: [],
    branches: [],
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };

    mockTenantRepo = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<SchoolsService>(SchoolsService);
  });

  describe('getSchoolMetrics', () => {
    it('should count only ACTIVE students in the school', async () => {
      const schoolWithStudents = {
        ...mockSchool,
        students: [
          { id: 'stu-1', status: 'ACTIVE' },
          { id: 'stu-2', status: 'INACTIVE' },
          { id: 'stu-3', status: 'ACTIVE' },
        ],
      };
      mockRepo.count.mockResolvedValue(5);
      mockRepo.findOne.mockResolvedValue(schoolWithStudents);

      const result = await service.getSchoolMetrics('school-1');

      expect(result.activeStudents).toBe(2);
      expect(result.classesCount).toBe(5);
      expect(result.eventsCount).toBe(0);
    });

    it('should return 0 activeStudents if school not found', async () => {
      mockRepo.count.mockResolvedValue(3);
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.getSchoolMetrics('school-1');

      expect(result.activeStudents).toBe(0);
      expect(result.classesCount).toBe(3);
    });
  });

  describe('getStudents', () => {
    it('should return school with students', async () => {
      const schoolWithStudents = { ...mockSchool, students: [{ id: 'stu-1' }] };
      mockRepo.findOne.mockResolvedValue(schoolWithStudents);

      const result = await service.getStudents('school-1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'school-1' },
        relations: ['students'],
      });
      expect(result.students).toHaveLength(1);
    });

    it('should throw NotFoundException if school not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getStudents('nonexistent')).rejects.toThrow(
        'School not found',
      );
    });
  });

  describe('addStudent', () => {
    it('should add student to school and save', async () => {
      const schoolEmpty = { ...mockSchool, students: [] };
      const schoolWithStudent = { ...mockSchool, students: [{ id: 'stu-1' }] };
      mockRepo.findOne.mockResolvedValue(schoolEmpty);
      mockRepo.save.mockResolvedValue(schoolWithStudent);

      const result = await service.addStudent('school-1', 'stu-1');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ students: [{ id: 'stu-1' }] }),
      );
      expect(result.students).toContainEqual(
        expect.objectContaining({ id: 'stu-1' }),
      );
    });

    it('should throw ConflictException if student already associated', async () => {
      const schoolWithStudent = { ...mockSchool, students: [{ id: 'stu-1' }] };
      mockRepo.findOne.mockResolvedValue(schoolWithStudent);

      await expect(service.addStudent('school-1', 'stu-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if school not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.addStudent('nonexistent', 'stu-1')).rejects.toThrow(
        'School not found',
      );
    });
  });

  describe('removeStudent', () => {
    it('should remove student from school, mutate entity, and save', async () => {
      const schoolWithStudent = { ...mockSchool, students: [{ id: 'stu-1' }] };
      const schoolEmpty = { ...mockSchool, students: [] };
      mockRepo.findOne.mockResolvedValue(schoolWithStudent);
      mockRepo.save.mockResolvedValue(schoolEmpty);

      const result = await service.removeStudent('school-1', 'stu-1');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ students: [] }),
      );
      expect(result.students).not.toContainEqual(
        expect.objectContaining({ id: 'stu-1' }),
      );
    });

    it('should throw NotFoundException if student not in school', async () => {
      const schoolEmpty = { ...mockSchool, students: [] };
      mockRepo.findOne.mockResolvedValue(schoolEmpty);

      await expect(
        service.removeStudent('school-1', 'stu-999'),
      ).rejects.toThrow('Student not associated with this school');
    });

    it('should throw NotFoundException if school not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.removeStudent('nonexistent', 'stu-1'),
      ).rejects.toThrow('School not found');
    });
  });
});
