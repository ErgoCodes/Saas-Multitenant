import { IsString, IsOptional } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;
}
