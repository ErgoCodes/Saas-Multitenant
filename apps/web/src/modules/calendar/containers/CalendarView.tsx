'use client';

import { useMemo, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { WsEvent } from '@task-manager/types';
import { useCalendarQuery, type CalendarTask } from '@/modules/calendar/hooks/useCalendarQuery';
import { useCalendarState } from '@/modules/calendar/hooks/useCalendarState';
import CalendarSkeleton from '@/modules/calendar/components/CalendarSkeleton';
import CalendarEmptyState from '@/modules/calendar/components/CalendarEmptyState';
import CalendarErrorState from '@/modules/calendar/components/CalendarErrorState';
import UnscheduledSidebar from '@/modules/calendar/components/UnscheduledSidebar';
import dynamic from 'next/dynamic';

const CalendarClient = dynamic(() => import('@/modules/calendar/components/CalendarClient'), {
  ssr: false,
  loading: () => <CalendarSkeleton />,
});

export default function CalendarView() {
  const state = useCalendarState();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useCalendarQuery({
    startDate: state.startDate,
    endDate: state.endDate,
    boardId: state.boardId,
    priority: state.priority,
    status: state.status,
    includeUnscheduled: true,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data: taskData }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/tasks/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    };

    const attachListeners = () => {
      socket.on(WsEvent.TASK_CREATED, invalidate);
      socket.on(WsEvent.TASK_UPDATED, invalidate);
      socket.on(WsEvent.TASK_DELETED, invalidate);
      socket.on(WsEvent.BOARD_DELETED, invalidate);
    };

    if (socket.connected) {
      attachListeners();
    }
    socket.on('connect', attachListeners);

    return () => {
      socket.off('connect', attachListeners);
      socket.off(WsEvent.TASK_CREATED, invalidate);
      socket.off(WsEvent.TASK_UPDATED, invalidate);
      socket.off(WsEvent.TASK_DELETED, invalidate);
      socket.off(WsEvent.BOARD_DELETED, invalidate);
    };
  }, [queryClient]);

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
      title: task.title,
      start: task.dueDate!,
      extendedProps: {
        taskId: task.id,
        boardId: task.list.boardId,
        priority: task.priority,
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
      ['calendar', state],
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
      ['calendar', state],
      (old: CalendarTask[] | undefined) =>
        old?.map((t) => (t.id === taskId ? { ...t, dueDate: newDate } : t))
    );

    updateTaskMutation.mutate(
      { id: taskId, data: { dueDate: newDate } },
      {
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

  return (
    <main className="flex flex-1">
      {isLoading ? (
        <CalendarSkeleton />
      ) : error ? (
        <CalendarErrorState
          message={error instanceof Error ? error.message : 'An unexpected error occurred'}
          onRetry={() => refetch()}
        />
      ) : scheduledTasks.length === 0 && unscheduledTasks.length === 0 ? (
        <CalendarEmptyState />
      ) : (
        <div className="flex flex-1 flex-col p-6">
          <CalendarClient
            events={events}
            onEventClick={handleEventClick}
            onEventDrop={handleEventDrop}
            onExternalDrop={handleExternalDrop}
          />
        </div>
      )}
      {!isLoading && !error && (
        <UnscheduledSidebar tasks={unscheduledTasks} onTaskClick={handleUnscheduledTaskClick} />
      )}
    </main>
  );
}
