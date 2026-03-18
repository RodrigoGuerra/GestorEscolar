import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query, ForbiddenException, Req } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // Only GESTOR/ADMIN/MANAGER can create invoices — STUDENT removed to prevent IDOR
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  // GESTOR/ADMIN/MANAGER see all; STUDENT sees only own (IDOR filter applied below)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.STUDENT)
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

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR, UserRole.STUDENT)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.GESTOR)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInvoiceStatusDto
  ) {
    return this.invoicesService.updateStatus(id, updateDto);
  }
}
