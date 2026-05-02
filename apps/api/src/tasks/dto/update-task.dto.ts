import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { Priority, TaskStatus } from '@task-manager/types';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  listId?: string;
}
