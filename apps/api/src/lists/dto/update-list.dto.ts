import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class UpdateListDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}
