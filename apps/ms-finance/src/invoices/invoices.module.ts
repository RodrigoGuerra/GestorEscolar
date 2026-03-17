import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { CronService } from '../cron/cron.service';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from '../common/tenant/tenant.module';

@Module({
  imports: [
    // F16: CronService still needs @InjectRepository (no HTTP request context)
    TypeOrmModule.forFeature([Invoice]),
    ConfigModule,
    TenantModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, CronService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
