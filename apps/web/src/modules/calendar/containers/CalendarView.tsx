'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useActiveOrganization } from '@/modules/organization/hooks/useActiveOrganization';
import { Priority, TaskStatus, WsEvent } from '@task-manager/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@task-manager/ui';
import { useCalendarQuery, type CalendarTask } from '@/modules/calendar/hooks/useCalendarQuery';
import { useCalendarState } from '@/modules/calendar/hooks/useCalendarState';
import CalendarSkeleton from '@/modules/calendar/components/CalendarSkeleton';
import CalendarErrorState from '@/modules/calendar/components/CalendarErrorState';
import UnscheduledSidebar from '@/modules/calendar/components/UnscheduledSidebar';
import dynamic from 'next/dynamic';

const CalendarClient = dynamic(() => import('@/modules/calendar/components/CalendarClient'), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

export default function CalendarView() {
  const state = useCalendarState();
  const { activeOrganizationId, isReady } = useActiveOrganization();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [visibleRange, setVisibleRange] = useState<{ start: string; end: string }>({
    start: state.startDate,
    end: state.endDate,
  });

  const queryParams = useMemo(
    () => ({
      startDate: visibleRange.start,
      endDate: visibleRange.end,
      organizationId: activeOrganizationId ?? undefined,
      boardId: state.boardId,
      priority: state.priority,
      status: state.status,
      includeUnscheduled: true,
    }),
    [
      visibleRange.start,
      visibleRange.end,
      activeOrganizationId,
      state.boardId,
      state.priority,
      state.status,
    ]
  );

  const { data, error, refetch } = useCalendarQuery(queryParams, { enabled: isReady });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data: taskData }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/tasks/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const boardIds = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((t) => t.list.boardId)));
  }, [data]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    };

    const attachListeners = () => {
      boardIds.forEach((id) => socket.emit(WsEvent.JOIN_BOARD, id));
      socket.on(WsEvent.TASK_CREATED, invalidate);
      socket.on(WsEvent.TASK_UPDATED, invalidate);
      socket.on(WsEvent.TASK_MOVED, invalidate);
      socket.on(WsEvent.TASK_DELETED, invalidate);
      socket.on(WsEvent.BOARD_DELETED, invalidate);
    };

    if (socket.connected) {
      attachListeners();
    }
    socket.on('connect', attachListeners);

    return () => {
      boardIds.forEach((id) => socket.emit(WsEvent.LEAVE_BOARD, id));
      socket.off('connect', attachListeners);
      socket.off(WsEvent.TASK_CREATED, invalidate);
      socket.off(WsEvent.TASK_UPDATED, invalidate);
      socket.off(WsEvent.TASK_MOVED, invalidate);
      socket.off(WsEvent.TASK_DELETED, invalidate);
      socket.off(WsEvent.BOARD_DELETED, invalidate);
    };
  }, [queryClient, boardIds]);

  const scheduledTasks = useMemo(() => {
    if (!data) return [];
    return data.filter((t: CalendarTask) => t.dueDate !== null);
  }, [data]);

  const unscheduledTasks = useMemo(() => {
    if (!data) return [];
    return data.filter((t: CalendarTask) => t.dueDate === null);
  }, [data]);

  const events = useMemo(() => {
    return scheduledTasks.map((task: CalendarTask) => ({
      id: task.id,
      title: `${task.title} (${task.list.board.title})`,
      start: task.dueDate!.slice(0, 10),
      extendedProps: {
        taskId: task.id,
        boardId: task.list.boardId,
        priority: task.priority,
        status: task.status,
      },
    }));
  }, [scheduledTasks]);

  const navigateToTaskBoard = useCallback(
    (taskId: string, sourceTasks: CalendarTask[]) => {
      const task = sourceTasks.find((t) => t.id === taskId);
      if (task) {
        router.push(`/boards/${task.list.boardId}`);
      }
    },
    [router]
  );

  function handleEventClick(taskId: string) {
    navigateToTaskBoard(taskId, scheduledTasks);
  }

  function handleEventDrop(taskId: string, newDate: string) {
    queryClient.setQueryData(
      ['calendar', queryParams],
      (old: CalendarTask[] | undefined) =>
        old?.map((t) => (t.id === taskId ? { ...t, dueDate: newDate } : t))
    );

    updateTaskMutation.mutate(
      { id: taskId, data: { dueDate: newDate } },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          toast.error('Failed to reschedule task');
        },
      }
    );
  }

  function handleExternalDrop(taskId: string, newDate: string) {
    queryClient.setQueryData(
      ['calendar', queryParams],
      (old: CalendarTask[] | undefined) =>
        old?.map((t) => (t.id === taskId ? { ...t, dueDate: newDate } : t))
    );

    updateTaskMutation.mutate(
      { id: taskId, data: { dueDate: newDate } },
      {
        onSuccess: () => {
          toast.success('Task scheduled');
        },
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          toast.error('Failed to schedule task');
        },
      }
    );
  }

  function handleUnscheduledTaskClick(taskId: string) {
    navigateToTaskBoard(taskId, unscheduledTasks);
  }

  const handleDatesChange = useCallback((startIso: string, endIso: string) => {
    setVisibleRange((prev) =>
      prev.start === startIso && prev.end === endIso ? prev : { start: startIso, end: endIso }
    );
  }, []);

  return (
    <main className="flex flex-1">
      {error ? (
        <CalendarErrorState
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
                Calendar
              </h1>
              <p className="text-sm text-muted-foreground">
                Drag unscheduled tasks from the right panel onto any day to schedule them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-36">
                <Select
                  value={state.status ?? 'ALL'}
                  onValueChange={(v) => state.setFilter('status', v === 'ALL' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                    <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Select
                  value={state.priority ?? 'ALL'}
                  onValueChange={(v) => state.setFilter('priority', v === 'ALL' ? undefined : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Priorities</SelectItem>
                    <SelectItem value={Priority.LOW}>Low</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={Priority.HIGH}>High</SelectItem>
                    <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <CalendarClient
            events={events}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onExternalDrop={handleExternalDrop}
            onDatesChange={handleDatesChange}
          />
        </div>
      )}
      {!error && (
        <UnscheduledSidebar tasks={unscheduledTasks} onTaskClick={handleUnscheduledTaskClick} />
      )}
    </main>
  );
}
