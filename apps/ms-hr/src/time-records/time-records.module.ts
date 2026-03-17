import { Module } from '@nestjs/common';
import { TimeRecordsService } from './time-records.service';
import { TimeRecordsController } from './time-records.controller';
import { EmployeesModule } from '../employees/employees.module';
import { TenantModule } from '../common/tenant/tenant.module';

@Module({
  imports: [TenantModule, EmployeesModule],
  controllers: [TimeRecordsController],
  providers: [TimeRecordsService],
})
export class TimeRecordsModule {}
