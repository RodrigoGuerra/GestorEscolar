import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateGradeDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  classId: string;

  @IsUUID()
  subjectId: string;

  @IsNumber()
  score: number;

  @IsString()
  term: string;
}

export class UpdateGradeDto {
  @IsNumber()
  score?: number;

  @IsString()
  term?: string;
}
