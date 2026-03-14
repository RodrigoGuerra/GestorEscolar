import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsUUID } from 'class-validator';

export enum UserRole {
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  EMPLOYEE = 'EMPLOYEE',
}

export class ProvisionUserDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsUUID()
  schoolId: string;

  @IsNotEmpty()
  franchiseSchema: string;

  @IsObject()
  @IsNotEmpty()
  domainData: Record<string, any>;
}
