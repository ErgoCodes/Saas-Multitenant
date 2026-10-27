import { IsString, IsOptional, IsEnum, IsNotEmpty, IsISO8601, MaxLength } from 'class-validator';
import { Priority, TaskStatus } from '@task-manager/types';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

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

  @IsString()
  @IsNotEmpty()
  listId: string;

  @IsISO8601({ strict: true })
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  assigneeId?: string;
}
