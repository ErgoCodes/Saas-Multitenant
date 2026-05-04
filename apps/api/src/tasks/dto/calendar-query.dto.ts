import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Priority, TaskStatus } from '@task-manager/types';

@ValidatorConstraint({ async: false })
class MaxDateSpanConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const obj = args.object as CalendarQueryDto;
    if (!obj.startDate) return true;
    const start = new Date(obj.startDate);
    const end = new Date(endDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 372;
  }

  defaultMessage() {
    return 'Date range must be between 0 and 372 days';
  }
}

export class CalendarQueryDto {
  @IsISO8601({ strict: true })
  startDate: string;

  @IsISO8601({ strict: true })
  @Validate(MaxDateSpanConstraint)
  endDate: string;

  @IsString()
  @IsOptional()
  boardId?: string;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    if (value === 'false' || value === false || value === '0') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  includeUnscheduled?: boolean;
}
