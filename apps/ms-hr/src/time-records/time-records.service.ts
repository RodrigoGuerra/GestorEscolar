import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeRecord } from './entities/time-record.entity';
import { PunchDto } from './dto/time-record.dto';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class TimeRecordsService {
  constructor(
    @InjectRepository(TimeRecord)
    private timeRecordsRepository: Repository<TimeRecord>,
    private employeesService: EmployeesService,
  ) {}

  async punch(punchDto: PunchDto): Promise<TimeRecord> {
    const { employeeId } = punchDto;
    await this.employeesService.findOne(employeeId); // Validate employee exists

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    let record = await this.timeRecordsRepository.findOne({
      where: { employeeId, date: today },
    });

    if (!record) {
      // First punch of the day: Clock In
      record = this.timeRecordsRepository.create({
        employeeId,
        date: today,
        clockIn: now,
      });
    } else if (!record.clockOut) {
      // Second punch of the day: Clock Out
      record.clockOut = now;
    } else {
      throw new BadRequestException('Already clocked out for today');
    }

    return this.timeRecordsRepository.save(record);
  }

  async findAllByEmployee(employeeId: string): Promise<TimeRecord[]> {
    return this.timeRecordsRepository.find({
      where: { employeeId },
      order: { date: 'DESC' },
    });
  }
}
