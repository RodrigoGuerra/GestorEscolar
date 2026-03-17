import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private client: ClientProxy;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly configService: ConfigService,
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBITMQ_URL')!],
        queue: 'school_events_queue',
        queueOptions: {
          // F21: durable queue survives broker restart — messages not lost
          durable: true,
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueInvoices() {
    this.logger.log('Running cron job to update overdue invoices...');
    
    const today = new Date().toISOString().split('T')[0];
    
    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PENDING,
        dueDate: LessThan(today),
      },
    });

    if (overdueInvoices.length === 0) {
      this.logger.log('No overdue invoices found.');
      return;
    }

    for (const invoice of overdueInvoices) {
      invoice.status = InvoiceStatus.OVERDUE;
      await this.invoiceRepository.save(invoice);
      
      this.logger.log(`Invoice ${invoice.id} marked as OVERDUE. Emitting event...`);
      
      // F21: persistent:true ensures messages survive broker restart
      this.client.emit(
        { cmd: 'student.overdue', persistent: true },
        {
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          schoolId: invoice.schoolId,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
        },
      );
    }

    this.logger.log(`Updated ${overdueInvoices.length} invoices to OVERDUE.`);
  }
}
