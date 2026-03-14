import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/transaction.dto';

@Controller('finance/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll(@Query('schoolId') schoolId?: string) {
    if (schoolId) {
      return this.transactionsService.findBySchool(schoolId);
    }
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.findOne(id);
  }
}
