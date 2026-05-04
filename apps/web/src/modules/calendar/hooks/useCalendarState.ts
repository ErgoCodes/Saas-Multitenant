'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { getDefaultMonth, parseMonth, getMonthRange, getWeekRange } from '@/lib/date-utils';

interface CalendarState {
  month: string;
  view: 'month' | 'week';
  boardId?: string;
  priority?: string;
  status?: string;
  startDate: string;
  endDate: string;
  setMonth: (month: string) => void;
  setView: (view: 'month' | 'week') => void;
  setFilter: (key: 'boardId' | 'priority' | 'status', value: string | undefined) => void;
}

export function useCalendarState(): CalendarState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const month = searchParams.get('month') ?? getDefaultMonth();
  const view = (searchParams.get('view') as 'month' | 'week') ?? 'month';
  const boardId = searchParams.get('boardId') ?? undefined;
  const priority = searchParams.get('priority') ?? undefined;
  const status = searchParams.get('status') ?? undefined;

  const date = useMemo(() => parseMonth(month), [month]);

  const { start: startDate, end: endDate } = useMemo(
    () => (view === 'week' ? getWeekRange(date) : getMonthRange(date)),
    [date, view]
  );

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  const setMonth = useCallback((v: string) => setParam('month', v), [setParam]);
  const setView = useCallback((v: 'month' | 'week') => setParam('view', v), [setParam]);
  const setFilter = useCallback(
    (key: 'boardId' | 'priority' | 'status', value: string | undefined) => setParam(key, value),
    [setParam]
  );

  return { month, view, boardId, priority, status, startDate, endDate, setMonth, setView, setFilter };
}
