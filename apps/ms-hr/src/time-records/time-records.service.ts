import { Injectable, BadRequestException } from '@nestjs/common';
import { TimeRecord } from './entities/time-record.entity';
import { PunchDto } from './dto/time-record.dto';
import { EmployeesService } from '../employees/employees.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class TimeRecordsService {
  constructor(
    private readonly tenantRepo: TenantRepositoryService,
    private readonly employeesService: EmployeesService,
  ) {}

  async punch(punchDto: PunchDto): Promise<TimeRecord> {
    const { employeeId } = punchDto;
    await this.employeesService.findOne(employeeId); // validate employee exists

    const repo = this.tenantRepo.getRepository(TimeRecord);
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    let record = await repo.findOne({ where: { employeeId, date: today } });

    if (!record) {
      record = repo.create({ employeeId, date: today, clockIn: now });
    } else if (!record.clockOut) {
      record.clockOut = now;
    } else {
      throw new BadRequestException('Already clocked out for today');
    }

    return repo.save(record);
  }

  async findAllByEmployee(employeeId: string): Promise<TimeRecord[]> {
    return this.tenantRepo
      .getRepository(TimeRecord)
      .find({ where: { employeeId }, order: { date: 'DESC' } });
  }
}
