import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';

@Controller('finance/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Query('studentId') studentId?: string) {
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
