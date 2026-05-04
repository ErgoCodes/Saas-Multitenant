'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { Board, List, Task } from '@task-manager/types';
import CalendarClient from '@/modules/calendar/components/CalendarClient';
import { Skeleton } from '@task-manager/ui';
import { toast } from 'sonner';

interface BoardCalendarViewProps {
  boardId: string;
}

export default function BoardCalendarView({ boardId }: BoardCalendarViewProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: board, isLoading, isError, error } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () =>
      api.get<Board & { lists: (List & { tasks: Task[] })[] }>(`/boards/${boardId}`),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data: taskData }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/tasks/${id}`, taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const events = useMemo(() => {
    if (!board?.lists) return [];
    return board.lists.flatMap((list) =>
      (list.tasks ?? [])
        .filter((task) => task.dueDate)
        .map((task) => ({
          id: task.id,
          title: task.title,
          start: task.dueDate!,
          extendedProps: {
            taskId: task.id,
            boardId: board.id,
            priority: task.priority,
          },
        }))
    );
  }, [board]);

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

  function handleEventClick(_taskId: string) {
    // no-op for board calendar — tasks are already in context
  }

  function handleEventDrop(taskId: string, newDate: string) {
    const original = board!.lists
      .flatMap((l) => l.tasks ?? [])
      .find((t) => t!.id === taskId);

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
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['board', boardId] });
          toast.error('Failed to reschedule task');
        },
      }
    );
  }

  function handleExternalDrop(_taskId: string, _newDate: string) {
    // external drag not applicable for board-level calendar
  }

  return (
    <main className="flex-1 p-6">
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
        onEventDrop={handleEventDrop}
        onExternalDrop={handleExternalDrop}
      />
    </main>
  );
}
