import { Injectable, NotFoundException } from '@nestjs/common';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly tenantRepo: TenantRepositoryService) {}

  create(createInvoiceDto: CreateInvoiceDto) {
    const repo = this.tenantRepo.getRepository(Invoice);
    const entity = repo.create({ ...createInvoiceDto, status: InvoiceStatus.PENDING });
    return repo.save(entity);
  }

  findAll() {
    return this.tenantRepo
      .getRepository(Invoice)
      .find({ order: { dueDate: 'DESC' } });
  }

  async findOne(id: string) {
    const entity = await this.tenantRepo.getRepository(Invoice).findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Invoice with ID ${id} not found`);
    return entity;
  }

  async updateStatus(id: string, updateDto: UpdateInvoiceStatusDto) {
    const repo = this.tenantRepo.getRepository(Invoice);
    const entity = await this.findOne(id);
    entity.status = updateDto.status as InvoiceStatus;
    if (updateDto.status === InvoiceStatus.PAID) {
      entity.paymentDate = new Date();
    }
    return repo.save(entity);
  }

  findByStudent(studentId: string) {
    return this.tenantRepo
      .getRepository(Invoice)
      .find({ where: { studentId }, order: { dueDate: 'DESC' } });
  }
}
