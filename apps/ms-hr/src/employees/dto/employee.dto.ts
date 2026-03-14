import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsEmail } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsNumber()
  @IsNotEmpty()
  hourlyRate: number;

  @IsUUID()
  @IsNotEmpty()
  schoolId: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsUUID()
  @IsOptional()
  schoolId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
