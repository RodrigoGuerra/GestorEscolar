import { IsString, IsNumber, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsNumber()
  year: number;

  @IsUUID()
  schoolId: string;
}

export class UpdateClassDto {
  @IsString()
  name?: string;

  @IsNumber()
  year?: number;
}
