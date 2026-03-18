import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GradesService } from './grades.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
import { Grade } from './entities/grade.entity';

describe('GradesService', () => {
  let service: GradesService;
  let mockRepo: any;

  const mockGrade = { id: 'g1', value: 9.5, subject: { id: 's1', name: 'Math' } };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const mockTenantRepo = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  describe('create', () => {
    it('should create and save a grade', async () => {
      const dto = { value: 9.5, subjectId: 's1' };
      const created = { ...dto, id: 'g1' };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('should return all grades with subject relation', async () => {
      mockRepo.find.mockResolvedValue([mockGrade]);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['subject'] });
      expect(result).toEqual([mockGrade]);
    });
  });

  describe('findOne', () => {
    it('should return the grade when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockGrade);

      const result = await service.findOne('g1');

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'g1' }, relations: ['subject'] });
      expect(result).toEqual(mockGrade);
    });

    it('should throw NotFoundException when grade does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an existing grade and return the updated entity', async () => {
      const dto = { value: 8.0 };
      const updatedGrade = { ...mockGrade, value: 8.0 };
      mockRepo.findOne
        .mockResolvedValueOnce(mockGrade)
        .mockResolvedValueOnce(updatedGrade);
      mockRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('g1', dto as any);

      expect(mockRepo.update).toHaveBeenCalledWith('g1', dto);
      expect(result).toEqual(updatedGrade);
    });

    it('should throw NotFoundException when updating non-existent grade', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', { value: 1 } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the grade and return { deleted: true }', async () => {
      mockRepo.findOne.mockResolvedValue(mockGrade);
      mockRepo.remove.mockResolvedValue(mockGrade);

      const result = await service.remove('g1');

      expect(mockRepo.remove).toHaveBeenCalledWith(mockGrade);
      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException when removing non-existent grade', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
