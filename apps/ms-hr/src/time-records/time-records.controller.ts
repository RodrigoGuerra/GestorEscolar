import { Controller, Post, Body, Get, Param, ParseUUIDPipe, ForbiddenException, Req } from '@nestjs/common';
import { TimeRecordsService } from './time-records.service';
import { PunchDto } from './dto/time-record.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

const PRIVILEGED_ROLES = new Set([UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR]);

// F11: employees can punch, managers can read records
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.EMPLOYEE)
@Controller('time-records')
export class TimeRecordsController {
  constructor(private readonly timeRecordsService: TimeRecordsService) {}

  @Post('punch')
  punch(@Body() punchDto: PunchDto, @Req() req: any) {
    // F18: employees can only punch for themselves
    const user = req.user;
    const role = user?.role?.toUpperCase() as UserRole;
    if (!PRIVILEGED_ROLES.has(role) && user?.sub !== punchDto.employeeId) {
      throw new ForbiddenException('You can only register your own time records');
    }
    return this.timeRecordsService.punch(punchDto);
  }

  @Get('employee/:id')
  findAllByEmployee(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    // F18: employees can only view their own records
    const user = req.user;
    const role = user?.role?.toUpperCase() as UserRole;
    if (!PRIVILEGED_ROLES.has(role) && user?.sub !== id) {
      throw new ForbiddenException('You can only view your own time records');
    }
    return this.timeRecordsService.findAllByEmployee(id);
  }
}
