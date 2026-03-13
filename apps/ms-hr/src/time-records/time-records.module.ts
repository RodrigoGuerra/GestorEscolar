import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeRecord } from './entities/time-record.entity';
import { TimeRecordsService } from './time-records.service';
import { TimeRecordsController } from './time-records.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimeRecord]), EmployeesModule],
  controllers: [TimeRecordsController],
  providers: [TimeRecordsService],
})
export class TimeRecordsModule {}
