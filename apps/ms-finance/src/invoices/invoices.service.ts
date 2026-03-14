import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly repository: Repository<Invoice>,
  ) {}

  create(createInvoiceDto: CreateInvoiceDto) {
    const entity = this.repository.create({
      ...createInvoiceDto,
      status: InvoiceStatus.PENDING,
    });
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find({ order: { dueDate: 'DESC' } });
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(`Invoice with ID ${id} not found`);
    return entity;
  }

  async updateStatus(id: string, updateDto: UpdateInvoiceStatusDto) {
    const entity = await this.findOne(id);
    entity.status = updateDto.status as InvoiceStatus;
    if (updateDto.status === InvoiceStatus.PAID) {
      entity.paymentDate = new Date();
    }
    return this.repository.save(entity);
  }

  async findByStudent(studentId: string) {
    return this.repository.find({ where: { studentId }, order: { dueDate: 'DESC' } });
  }
}
