import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  workload: number;

  @IsString()
  @IsOptional()
  syllabus?: string;

  @IsUUID()
  @IsOptional()
  matrixId?: string;
}

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  workload?: number;

  @IsString()
  @IsOptional()
  syllabus?: string;

  @IsUUID()
  @IsOptional()
  matrixId?: string;
}
