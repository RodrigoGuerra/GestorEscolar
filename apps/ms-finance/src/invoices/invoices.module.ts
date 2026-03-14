import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { CronService } from '../cron/cron.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    ConfigModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, CronService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
