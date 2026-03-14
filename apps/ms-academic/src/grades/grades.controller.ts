import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';

@Controller('academic/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  create(@Body() createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Get()
  findAll() {
    return this.gradesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.gradesService.remove(id);
  }
}
