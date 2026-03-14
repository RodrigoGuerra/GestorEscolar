import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  create(createTransactionDto: CreateTransactionDto) {
    const entity = this.repository.create(createTransactionDto);
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Transaction with ID ${id} not found`);
    return entity;
  }

  async findBySchool(schoolId: string) {
    return this.repository.find({ where: { schoolId }, order: { createdAt: 'DESC' } });
  }
}
