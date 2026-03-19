import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TenantRepositoryService } from '../common/tenant/tenant-repository.service';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let mockRepo: any;
  let mockTenantRepo: any;

  const mockInvoice = {
    id: 'inv-1',
    studentId: 'stu-1',
    amount: 100,
    dueDate: new Date(),
    status: InvoiceStatus.PENDING,
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockTenantRepo = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: TenantRepositoryService, useValue: mockTenantRepo },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('create', () => {
    it('should create and save a pending invoice', async () => {
      const dto = { studentId: 'stu-1', amount: 100, dueDate: new Date() };
      const created = { ...dto, id: 'inv-1', status: InvoiceStatus.PENDING };
      mockRepo.create.mockReturnValue(created);
      mockRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: InvoiceStatus.PENDING }));
      expect(mockRepo.save).toHaveBeenCalledWith(created);
      expect(result.status).toBe(InvoiceStatus.PENDING);
    });
  });

  describe('updateStatus', () => {
    it('should update status to PAID and set paymentDate', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockInvoice });
      mockRepo.save.mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.updateStatus('inv-1', { status: 'PAID' } as any);

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paymentDate).toBeDefined();
    });

    it('should throw NotFoundException if invoice not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('bad-id', { status: 'PAID' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
