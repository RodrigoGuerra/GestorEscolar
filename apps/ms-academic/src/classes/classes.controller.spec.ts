import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: jest.Mocked<ClassesService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      assignStudent: jest.fn(),
      removeStudent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [{ provide: ClassesService, useValue: mockService }],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
    service = module.get(ClassesService);
  });

  describe('removeStudent', () => {
    it('should call service.removeStudent with classId and studentId', async () => {
      const classId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const studentId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
      service.removeStudent.mockResolvedValue({ id: classId, students: [] } as any);

      await controller.removeStudent(classId, studentId);

      expect(service.removeStudent).toHaveBeenCalledWith(classId, studentId);
    });
  });
});
