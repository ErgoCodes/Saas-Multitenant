'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import type { Task } from '@task-manager/types';

export interface CalendarTask extends Task {
  list: {
    id: string;
    title: string;
    boardId: string;
    board: { id: string; title: string; organizationId?: string };
  };
}

interface CalendarQueryParams {
  startDate: string;
  endDate: string;
  organizationId?: string;
  boardId?: string;
  priority?: string;
  status?: string;
  includeUnscheduled?: boolean;
}

export function useCalendarQuery(params: CalendarQueryParams, options: { enabled?: boolean } = {}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['calendar', params],
    queryFn: () => {
      const search = new URLSearchParams();
      search.set('startDate', params.startDate);
      search.set('endDate', params.endDate);
      if (params.organizationId) search.set('organizationId', params.organizationId);
      if (params.boardId) search.set('boardId', params.boardId);
      if (params.priority) search.set('priority', params.priority);
      if (params.status) search.set('status', params.status);
      if (params.includeUnscheduled) search.set('includeUnscheduled', 'true');
      return api.get<CalendarTask[]>(`/tasks/calendar?${search.toString()}`);
    },
    enabled:
      (options.enabled ?? true) && isAuthenticated && !!params.startDate && !!params.endDate,
    staleTime: 30_000,
  });
}
