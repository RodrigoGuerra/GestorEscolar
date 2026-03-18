import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('handleStudentOverdue', () => {
    it('should handle the student.overdue event without throwing', () => {
      const payload = { studentId: 'stu-1', invoiceId: 'inv-1' };

      expect(() => appController.handleStudentOverdue(payload)).not.toThrow();
    });
  });
});
