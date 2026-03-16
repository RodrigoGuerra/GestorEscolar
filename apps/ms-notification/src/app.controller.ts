import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @EventPattern('student.overdue')
  handleStudentOverdue(@Payload() data: any) {
    this.logger.log(
      `[Notification] Received student.overdue event: ${JSON.stringify(data)}`,
    );
    // Here we would trigger email/push notification
    this.logger.log(
      `Alerting student ${data.studentId} about overdue invoice ${data.invoiceId}`,
    );
  }
}
