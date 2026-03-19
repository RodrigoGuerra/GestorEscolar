import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { Logger } from '@nestjs/common';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('handleStudentOverdue', () => {
    it('should log the overdue event', () => {
      const data = { studentId: 'stu-1', invoiceId: 'inv-1' };
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      controller.handleStudentOverdue(data);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received student.overdue event'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Alerting student stu-1 about overdue invoice inv-1'),
      );
    });
  });
});
