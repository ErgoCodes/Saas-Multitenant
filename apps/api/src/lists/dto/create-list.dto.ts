import { IsString } from 'class-validator';

export class CreateListDto {
  @IsString()
  title: string;

  @IsString()
  boardId: string;
}
