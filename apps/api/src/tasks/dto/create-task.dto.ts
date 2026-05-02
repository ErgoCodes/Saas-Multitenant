import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Priority } from '@task-manager/types';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  listId: string;
}
