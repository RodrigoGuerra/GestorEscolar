import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsUUID, Matches } from 'class-validator';
import { MaxObjectSize } from '../../common/validators/max-object-size.validator';

export enum UserRole {
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  GESTOR = 'GESTOR',
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

  // F8: validate schema name format — must be a safe PostgreSQL identifier
  // (same regex used in TenantInterceptor to prevent SQL injection)
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]{0,62}$/, {
    message:
      'franchiseSchema must be a valid PostgreSQL identifier: lowercase letters, digits and underscores only, starting with a letter, max 63 chars',
  })
  franchiseSchema: string;

  @IsObject()
  @IsNotEmpty()
  @MaxObjectSize()
  domainData: Record<string, any>;
}
