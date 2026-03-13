import { IsUUID, IsNotEmpty } from 'class-validator';

export class PunchDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;
}
