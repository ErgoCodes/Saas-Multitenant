import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CalendarQueryDto } from './calendar-query.dto';

describe('CalendarQueryDto', () => {
  const validBase = {
    startDate: '2026-05-01T00:00:00.000Z',
    endDate: '2026-05-31T23:59:59.999Z',
  };

  describe('includeUnscheduled boolean coercion', () => {
    it('should accept string "true" and coerce to boolean true', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: 'true',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBe(true);
    });

    it('should accept string "false" and coerce to boolean false', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: 'false',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBe(false);
    });

    it('should accept string "1" and coerce to boolean true', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: '1',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBe(true);
    });

    it('should accept string "0" and coerce to boolean false', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: '0',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBe(false);
    });

    it('should pass through actual boolean true unchanged', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: true,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBe(true);
    });

    it('should pass through actual boolean false unchanged', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: false,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBe(false);
    });

    it('should accept omitted includeUnscheduled as undefined', async () => {
      const dto = plainToInstance(CalendarQueryDto, validBase);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.includeUnscheduled).toBeUndefined();
    });

    it('should reject string "maybe" with IsBoolean error', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: 'maybe',
      });
      const errors = await validate(dto);
      const includeUnscheduledErrors = errors.filter(
        (e) => e.property === 'includeUnscheduled',
      );
      expect(includeUnscheduledErrors).toHaveLength(1);
      expect(includeUnscheduledErrors[0].constraints).toMatchObject({
        isBoolean: 'includeUnscheduled must be a boolean value',
      });
    });

    it('should reject numeric 123 with IsBoolean error', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: 123,
      });
      const errors = await validate(dto);
      const includeUnscheduledErrors = errors.filter(
        (e) => e.property === 'includeUnscheduled',
      );
      expect(includeUnscheduledErrors).toHaveLength(1);
      expect(includeUnscheduledErrors[0].constraints).toMatchObject({
        isBoolean: 'includeUnscheduled must be a boolean value',
      });
    });

    it('should reject empty string with IsBoolean error', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: '',
      });
      const errors = await validate(dto);
      const includeUnscheduledErrors = errors.filter(
        (e) => e.property === 'includeUnscheduled',
      );
      expect(includeUnscheduledErrors).toHaveLength(1);
      expect(includeUnscheduledErrors[0].constraints).toMatchObject({
        isBoolean: 'includeUnscheduled must be a boolean value',
      });
    });

    it('should reject uppercase "TRUE" with IsBoolean error', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        ...validBase,
        includeUnscheduled: 'TRUE',
      });
      const errors = await validate(dto);
      const includeUnscheduledErrors = errors.filter(
        (e) => e.property === 'includeUnscheduled',
      );
      expect(includeUnscheduledErrors).toHaveLength(1);
      expect(includeUnscheduledErrors[0].constraints).toMatchObject({
        isBoolean: 'includeUnscheduled must be a boolean value',
      });
    });
  });

  describe('other field validations', () => {
    it('should reject missing startDate', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        endDate: validBase.endDate,
      });
      const errors = await validate(dto);
      const startDateErrors = errors.filter((e) => e.property === 'startDate');
      expect(startDateErrors).toHaveLength(1);
    });

    it('should reject invalid startDate format', async () => {
      const dto = plainToInstance(CalendarQueryDto, {
        startDate: 'not-a-date',
        endDate: validBase.endDate,
      });
      const errors = await validate(dto);
      const startDateErrors = errors.filter((e) => e.property === 'startDate');
      expect(startDateErrors).toHaveLength(1);
    });
  });
});
