import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}
