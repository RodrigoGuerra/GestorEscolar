import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';
import { ClientProxy, ClientProxyFactory, RmqRecord, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

// PostgreSQL system schemas that must never be processed as tenant schemas
const SYSTEM_SCHEMAS = ['public', 'pg_catalog', 'information_schema', 'pg_toast'];

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private client: ClientProxy;

  constructor(
    private readonly dataSource: DataSource,
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
    this.logger.log('Running cron job to update overdue invoices across all tenant schemas...');

    // Discover all tenant schemas dynamically: exclude system schemas and pg_* internals
    const schemaParams = SYSTEM_SCHEMAS.map((_, i) => `$${i + 1}`).join(',');
    const schemaRows: { nspname: string }[] = await this.dataSource.query(
      `SELECT nspname FROM pg_namespace
       WHERE nspname NOT IN (${schemaParams})
         AND nspname NOT LIKE 'pg_%'`,
      SYSTEM_SCHEMAS,
    );

    const today = new Date().toISOString().split('T')[0];
    let totalUpdated = 0;

    for (const { nspname } of schemaRows) {
      const qr = this.dataSource.createQueryRunner();
      try {
        await qr.connect();
        await qr.query(`SET search_path TO "${nspname}", public`);

        // Check if this schema actually has an invoices table before querying
        const tableExists: { exists: boolean }[] = await qr.query(
          `SELECT EXISTS (
             SELECT 1 FROM information_schema.tables
             WHERE table_schema = $1 AND table_name = 'invoices'
           ) AS exists`,
          [nspname],
        );
        if (!tableExists[0]?.exists) continue;

        const overdueInvoices: { id: string; studentId: string; schoolId: string; amount: number; dueDate: string }[] =
          await qr.query(
            `SELECT id, "studentId", "schoolId", amount, "dueDate"
             FROM invoices
             WHERE status = $1 AND "dueDate" < $2`,
            [InvoiceStatus.PENDING, today],
          );

        for (const invoice of overdueInvoices) {
          await qr.query(
            `UPDATE invoices SET status = $1 WHERE id = $2`,
            [InvoiceStatus.OVERDUE, invoice.id],
          );

          this.logger.log(`[${nspname}] Invoice ${invoice.id} marked as OVERDUE.`);

          // I3/F21: use RmqRecord so persistent:true is set as an actual AMQP property
          this.client.emit(
            'student.overdue',
            new RmqRecord(
              {
                invoiceId: invoice.id,
                studentId: invoice.studentId,
                schoolId: invoice.schoolId,
                amount: invoice.amount,
                dueDate: invoice.dueDate,
              },
              { persistent: true },
            ),
          );
          totalUpdated++;
        }
      } catch (err) {
        this.logger.warn(`Schema "${nspname}" skipped: ${(err as Error).message}`);
      } finally {
        await qr.release();
      }
    }

    this.logger.log(
      `Updated ${totalUpdated} invoices to OVERDUE across ${schemaRows.length} schemas.`,
    );
  }
}
