import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, ForbiddenException, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

// F11: GESTOR, ADMIN and MANAGER manage finances; STUDENT can read own invoices
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.STUDENT)
@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Query('studentId') studentId: string | undefined, @Req() req: any) {
    const user = req.user;
    const role = user?.role?.toUpperCase();

    // C2/F18: STUDENT is always scoped to their own invoices — auto-fill studentId if omitted
    if (role === UserRole.STUDENT) {
      const effectiveStudentId = studentId ?? user?.sub;
      if (!effectiveStudentId || effectiveStudentId !== user?.sub) {
        throw new ForbiddenException('You can only view your own invoices');
      }
      return this.invoicesService.findByStudent(effectiveStudentId);
    }

    if (studentId) {
      return this.invoicesService.findByStudent(studentId);
    }
    return this.invoicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInvoiceStatusDto
  ) {
    return this.invoicesService.updateStatus(id, updateDto);
  }
}
