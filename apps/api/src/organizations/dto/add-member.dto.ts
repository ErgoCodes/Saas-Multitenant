import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { OrgRole } from '@task-manager/types';

export class AddOrganizationMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(OrgRole)
  @IsOptional()
  role?: OrgRole;
}
