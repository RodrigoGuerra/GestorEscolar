import { Controller, Post, Body, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { TimeRecordsService } from './time-records.service';
import { PunchDto } from './dto/time-record.dto';

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
