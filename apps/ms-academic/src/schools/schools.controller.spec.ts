import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';

describe('SchoolsController — student association', () => {
  let controller: SchoolsController;
  let service: jest.Mocked<SchoolsService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getSchoolMetrics: jest.fn(),
      getStudents: jest.fn(),
      addStudent: jest.fn(),
      removeStudent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolsController],
      providers: [{ provide: SchoolsService, useValue: mockService }],
    }).compile();

    controller = module.get<SchoolsController>(SchoolsController);
    service = module.get(SchoolsService);
  });

  describe('getStudents', () => {
    it('should call service.getStudents with schoolId', async () => {
      const schoolId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      service.getStudents.mockResolvedValue({ id: schoolId, students: [] } as any);

      await controller.getStudents(schoolId);

      expect(service.getStudents).toHaveBeenCalledWith(schoolId);
    });
  });

  describe('addStudent', () => {
    it('should call service.addStudent with schoolId and studentId', async () => {
      const schoolId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const studentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      service.addStudent.mockResolvedValue({ id: schoolId, students: [] } as any);

      await controller.addStudent(schoolId, studentId);

      expect(service.addStudent).toHaveBeenCalledWith(schoolId, studentId);
    });
  });

  describe('removeStudent', () => {
    it('should call service.removeStudent with schoolId and studentId', async () => {
      const schoolId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const studentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      service.removeStudent.mockResolvedValue({ id: schoolId, students: [] } as any);

      await controller.removeStudent(schoolId, studentId);

      expect(service.removeStudent).toHaveBeenCalledWith(schoolId, studentId);
    });
  });
});
