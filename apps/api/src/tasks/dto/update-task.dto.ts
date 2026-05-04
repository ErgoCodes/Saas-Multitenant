import { IsString, IsOptional, IsEnum, IsISO8601, IsNumber, MaxLength } from 'class-validator';
import { Priority, TaskStatus } from '@task-manager/types';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsString()
  @IsOptional()
  listId?: string;

  @IsISO8601({ strict: true })
  @IsOptional()
  dueDate?: string;
}
