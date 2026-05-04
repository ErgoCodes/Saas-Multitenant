import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
} from 'date-fns';

export function getMonthRange(date: Date) {
  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
  };
}

export function getWeekRange(date: Date, weekStartsOn: 0 | 1 = 0) {
  return {
    start: startOfWeek(date, { weekStartsOn }).toISOString(),
    end: endOfWeek(date, { weekStartsOn }).toISOString(),
  };
}

export function formatTaskDate(date: string | Date | null) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function getDefaultMonth() {
  return format(new Date(), 'yyyy-MM');
}

export function parseMonth(monthStr: string) {
  return new Date(`${monthStr}-01T00:00:00`);
}
