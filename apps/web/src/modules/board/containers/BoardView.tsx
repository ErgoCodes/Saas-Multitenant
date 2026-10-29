'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Board, List, Task, TaskStatus, WsEvent } from '@task-manager/types';
import { Skeleton } from '@task-manager/ui';
import ListColumn from '@/modules/board/components/ListColumn';
import CreateListForm from '@/modules/board/containers/CreateListForm';
import TaskDetailSheet from '@/modules/board/containers/TaskDetailSheet';
import { TaskCardView } from '@/modules/board/components/TaskCard';

interface BoardViewProps {
  boardId: string;
}

export default function BoardView({ boardId }: BoardViewProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () =>
      api.get<Board & { lists: (List & { tasks: Task[] })[] }>(`/boards/${boardId}`),
    enabled: isAuthenticated,
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
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      toast.error('Failed to update task');
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (listId: string) => api.delete(`/lists/${listId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('List deleted');
    },
    onError: () => {
      toast.error('Failed to delete list');
    },
  });

  function handleStatusChange(task: Task, nextStatus: TaskStatus) {
    queryClient.setQueryData(['board', boardId], (old: typeof board) => {
      if (!old) return old;
      return {
        ...old,
        lists: old.lists?.map((list) => ({
          ...list,
          tasks: list.tasks?.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)),
        })),
      };
    });

    updateTaskMutation.mutate({
      id: task.id,
      data: { status: nextStatus },
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  function findListByTaskId(taskId: string): (List & { tasks: Task[] }) | undefined {
    return board?.lists?.find((list: List & { tasks: Task[] }) => list.tasks?.some((t: Task) => t.id === taskId));
  }

  function handleDragStart(event: DragStartEvent) {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !board?.lists) return;

    const activeList = findListByTaskId(active.id as string);
    let overList: (List & { tasks: Task[] }) | undefined;

    if (over.data.current?.type === 'list') {
      overList = board.lists.find((l: List & { tasks: Task[] }) => l.id === over.id);
    } else {
      overList = findListByTaskId(over.id as string);
    }

    if (!activeList || !overList || activeList.id === overList.id) return;

    const activeListId = activeList.id;
    const overListId = overList.id;

    queryClient.setQueryData(['board', boardId], (old: typeof board) => {
      if (!old) return old;
      return {
        ...old,
        lists: old.lists?.map((list: List & { tasks: Task[] }) => {
          if (list.id === activeListId) {
            return {
              ...list,
              tasks: list.tasks?.filter((t: Task) => t.id !== active.id),
            };
          }
          if (list.id === overListId) {
            const overIndex = overList.tasks?.findIndex((t: Task) => t.id === over.id) ?? -1;
            const movingTask = activeList.tasks?.find((t: Task) => t.id === active.id);
            if (!movingTask) return list;
            const newTasks = [...(list.tasks || [])];
            const insertAt = overIndex >= 0 ? overIndex : newTasks.length;
            newTasks.splice(insertAt, 0, { ...movingTask, listId: list.id });
            return { ...list, tasks: newTasks };
          }
          return list;
        }),
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !board?.lists) return;

    const activeList = findListByTaskId(active.id as string);
    if (!activeList) return;

    const overList =
      over.data.current?.type === 'list'
        ? board.lists.find((l: List & { tasks: Task[] }) => l.id === over.id)
        : findListByTaskId(over.id as string);
    if (!overList) return;

    const oldListId = activeList.id;
    const newListId = overList.id;
    const oldIndex = activeList.tasks?.findIndex((t: Task) => t.id === active.id) ?? -1;
    const rawOverIndex = overList.tasks?.findIndex((t: Task) => t.id === over.id) ?? -1;
    const targetOrder = rawOverIndex >= 0 ? rawOverIndex : Math.max(0, (overList.tasks?.length ?? 1) - 1);

    if (oldListId === newListId && oldIndex === targetOrder && activeTask?.listId === newListId) return;

    if (oldListId === newListId && rawOverIndex >= 0) {
      queryClient.setQueryData(['board', boardId], (old: typeof board) => {
        if (!old) return old;
        return {
          ...old,
          lists: old.lists?.map((list: List & { tasks: Task[] }) => {
            if (list.id !== oldListId) return list;
            const reordered = arrayMove(list.tasks || [], oldIndex, rawOverIndex);
            return { ...list, tasks: reordered };
          }),
        };
      });
    }

    updateTaskMutation.mutate({
      id: active.id as string,
      data: { listId: newListId, order: targetOrder },
    });
  }

  return (
    <main className="flex-1 overflow-x-auto p-6">
      {isLoading ? (
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : board ? (
        <>
          <div className="mb-6">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              {board.title}
            </h1>
            {board.description && (
              <p className="mt-1 text-sm text-muted-foreground">{board.description}</p>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4">
              {board.lists
                ?.sort((a: List & { tasks: Task[] }, b: List & { tasks: Task[] }) => a.order - b.order)
                .map((list: List & { tasks: Task[] }) => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    boardId={boardId}
                    onSelectTask={setSelectedTask}
                    onStatusChange={handleStatusChange}
                    onDeleteList={(id) => deleteListMutation.mutate(id)}
                  />
                ))}
              <CreateListForm boardId={boardId} />
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="rotate-3 opacity-90">
                  <TaskCardView task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <TaskDetailSheet
            task={selectedTask}
            lists={board.lists || []}
            boardId={boardId}
            organizationId={board.organizationId}
            onClose={() => setSelectedTask(null)}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
            Board not found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This board may have been deleted or you don&apos;t have access.
          </p>
        </div>
      )}
    </main>
  );
}
