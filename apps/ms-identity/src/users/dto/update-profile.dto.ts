import { IsOptional, IsString, MaxLength } from 'class-validator';

/** F19: only allow safe, user-editable fields — never role, googleId, email, etc. */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;
}
