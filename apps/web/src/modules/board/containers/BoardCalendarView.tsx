'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Board, List, Task, WsEvent } from '@task-manager/types';
import CalendarClient from '@/modules/calendar/components/CalendarClient';
import UnscheduledSidebar from '@/modules/calendar/components/UnscheduledSidebar';
import TaskDetailSheet from '@/modules/board/containers/TaskDetailSheet';
import { Skeleton } from '@task-manager/ui';
import { toast } from 'sonner';

interface BoardCalendarViewProps {
  boardId: string;
}

export default function BoardCalendarView({ boardId }: BoardCalendarViewProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: board, isLoading, isError, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () =>
      api.get<Board & { lists: (List & { tasks: Task[] })[] }>(`/boards/${boardId}`),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    };

    const joinAndListen = () => {
      socket.emit(WsEvent.JOIN_BOARD, boardId);
      socket.on(WsEvent.TASK_CREATED, invalidate);
      socket.on(WsEvent.TASK_UPDATED, invalidate);
      socket.on(WsEvent.TASK_MOVED, invalidate);
      socket.on(WsEvent.TASK_DELETED, invalidate);
      socket.on(WsEvent.LIST_CREATED, invalidate);
      socket.on(WsEvent.LIST_UPDATED, invalidate);
      socket.on(WsEvent.LIST_DELETED, invalidate);
      socket.on(WsEvent.BOARD_UPDATED, invalidate);
    };

    if (socket.connected) {
      joinAndListen();
    }
    socket.on('connect', joinAndListen);

    return () => {
      socket.emit(WsEvent.LEAVE_BOARD, boardId);
      socket.off('connect', joinAndListen);
      socket.off(WsEvent.TASK_CREATED, invalidate);
      socket.off(WsEvent.TASK_UPDATED, invalidate);
      socket.off(WsEvent.TASK_MOVED, invalidate);
      socket.off(WsEvent.TASK_DELETED, invalidate);
      socket.off(WsEvent.LIST_CREATED, invalidate);
      socket.off(WsEvent.LIST_UPDATED, invalidate);
      socket.off(WsEvent.LIST_DELETED, invalidate);
      socket.off(WsEvent.BOARD_UPDATED, invalidate);
    };
  }, [boardId, queryClient]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data: taskData }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/tasks/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const allTasks = useMemo(() => {
    if (!board?.lists) return [];
    return board.lists.flatMap((list) => list.tasks ?? []);
  }, [board]);

  const unscheduledTasks = useMemo(() => {
    return allTasks.filter((task) => !task.dueDate);
  }, [allTasks]);

  const events = useMemo(() => {
    return allTasks
      .filter((task) => task.dueDate)
      .map((task) => ({
        id: task.id,
        title: task.title,
        start: task.dueDate!.slice(0, 10),
        extendedProps: {
          taskId: task.id,
          boardId: board!.id,
          priority: task.priority,
          status: task.status,
        },
      }));
  }, [allTasks, board]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="flex-1 p-6">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : 'Failed to load board calendar'}
        </p>
      </div>
    );
  }

  function handleEventClick(taskId: string) {
    const found = allTasks.find((t) => t.id === taskId);
    if (found) setSelectedTask(found);
  }

  function handleTaskSchedule(taskId: string, newDate: string) {
    queryClient.setQueryData(
      ['board', boardId],
      (old: (Board & { lists: (List & { tasks: Task[] })[] }) | undefined) => {
        if (!old) return old;
        return {
          ...old,
          lists: old.lists.map((list) => ({
            ...list,
            tasks: (list.tasks ?? []).map((t) =>
              t.id === taskId ? { ...t, dueDate: newDate } : t
            ),
          })),
        };
      }
    );

    updateTaskMutation.mutate(
      { id: taskId, data: { dueDate: newDate } },
      {
        onSuccess: () => {
          toast.success('Task scheduled');
        },
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
          toast.error('Failed to reschedule task');
        },
      }
    );
  }

  return (
    <main className="flex flex-1">
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-6">
          <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
            {board.title}
          </h1>
          {board.description && (
            <p className="mt-1 text-sm text-muted-foreground">{board.description}</p>
          )}
        </div>
        <CalendarClient
          events={events}
          onEventClick={handleEventClick}
          onEventDrop={handleTaskSchedule}
          onExternalDrop={handleTaskSchedule}
        />
      </div>
      <UnscheduledSidebar tasks={unscheduledTasks} onTaskClick={handleEventClick} />
      <TaskDetailSheet
        task={selectedTask}
        lists={board.lists || []}
        boardId={boardId}
        organizationId={board.organizationId}
        onClose={() => setSelectedTask(null)}
      />
    </main>
  );
}
