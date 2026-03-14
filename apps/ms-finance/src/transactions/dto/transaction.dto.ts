import { IsString, IsNumber, IsEnum, IsUUID, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  schoolId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE';

  @IsString()
  description: string;

  @IsUUID()
  @IsOptional()
  relatedEntityId?: string;
}
