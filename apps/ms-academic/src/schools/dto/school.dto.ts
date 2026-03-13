import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @IsBoolean()
  @IsOptional()
  isMatrix?: boolean;

  @IsUUID()
  @IsOptional()
  parentSchoolId?: string;
}

export class UpdateSchoolDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsBoolean()
  @IsOptional()
  isMatrix?: boolean;

  @IsUUID()
  @IsOptional()
  parentSchoolId?: string;
}
