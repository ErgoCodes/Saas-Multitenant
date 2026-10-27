import { IsEnum } from 'class-validator';
import { OrgRole } from '@task-manager/types';

export class UpdateOrganizationMemberDto {
  @IsEnum(OrgRole)
  role: OrgRole;
}
