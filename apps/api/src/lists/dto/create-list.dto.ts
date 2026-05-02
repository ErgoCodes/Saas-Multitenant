import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  boardId: string;
}
