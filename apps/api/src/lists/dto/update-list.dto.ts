import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
