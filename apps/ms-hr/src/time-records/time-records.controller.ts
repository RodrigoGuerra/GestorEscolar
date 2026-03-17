import { Controller, Post, Body, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { TimeRecordsService } from './time-records.service';
import { PunchDto } from './dto/time-record.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

// F11: employees can punch, managers can read records
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.EMPLOYEE)
@Controller('time-records')
export class TimeRecordsController {
  constructor(private readonly timeRecordsService: TimeRecordsService) {}

  @Post('punch')
  punch(@Body() punchDto: PunchDto) {
    return this.timeRecordsService.punch(punchDto);
  }

  @Get('employee/:id')
  findAllByEmployee(@Param('id', ParseUUIDPipe) id: string) {
    return this.timeRecordsService.findAllByEmployee(id);
  }
}
