import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/transaction.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  create(createTransactionDto: CreateTransactionDto) {
    const repo = this.tenantRepo.getRepository(Transaction);
    return repo.save(repo.create(createTransactionDto));
  }

  findAll() {
    return this.tenantRepo
      .getRepository(Transaction)
      .find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const entity = await this.tenantRepo
      .getRepository(Transaction)
      .findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Transaction with ID ${id} not found`);
    return entity;
  }

  findBySchool(schoolId: string) {
    return this.tenantRepo
      .getRepository(Transaction)
      .find({ where: { schoolId }, order: { createdAt: 'DESC' } });
  }
}
