import { IsString, IsNumber, IsDateString, IsEnum, IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  schoolId: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  dueDate: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(['PENDING', 'PAID', 'OVERDUE'])
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}
