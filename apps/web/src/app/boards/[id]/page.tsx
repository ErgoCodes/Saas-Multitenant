'use client';

import { use, useState } from 'react';
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
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useAuthStore } from '../../../stores/auth';
import { api } from '../../../lib/api';
import { Board, List, Task } from '@task-manager/types';
import Header from '../../../components/Header';
import ListColumn from '../../../components/ListColumn';
import CreateListModal from '../../../components/CreateListModal';
import TaskCard, { TaskCardView } from '../../../components/TaskCard';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Spinner, Skeleton } from '@task-manager/ui';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () =>
      api.get<Board & { lists: (List & { tasks: Task[] })[] }>(`/boards/${boardId}`),
    enabled: isAuthenticated,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

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
    const overIndex = overList.tasks?.findIndex((t: Task) => t.id === over.id) ?? -1;

    if (oldListId === newListId && oldIndex === overIndex) return;

    if (oldListId === newListId) {
      queryClient.setQueryData(['board', boardId], (old: typeof board) => {
        if (!old) return old;
        return {
          ...old,
          lists: old.lists?.map((list: List & { tasks: Task[] }) => {
            if (list.id !== oldListId) return list;
            const reordered = arrayMove(list.tasks || [], oldIndex, overIndex);
            return { ...list, tasks: reordered };
          }),
        };
      });
    }

    updateTaskMutation.mutate({
      id: active.id as string,
      data: { listId: newListId, order: overIndex },
    });
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-surface-50">
        <Header />
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
                <h1 className="font-heading text-xl font-bold tracking-tight text-surface-900">
                  {board.title}
                </h1>
                {board.description && (
                  <p className="mt-1 text-sm text-surface-500">{board.description}</p>
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
                      <ListColumn key={list.id} list={list} boardId={boardId} />
                    ))}
                  <CreateListModal boardId={boardId} />
                </div>

                <DragOverlay>
                  {activeTask ? (
                    <div className="rotate-3 opacity-90">
                      <TaskCard task={activeTask} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-200 text-surface-400">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-surface-900">
                Board not found
              </h3>
              <p className="mt-1 text-sm text-surface-500">
                This board may have been deleted or you don&apos;t have access.
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
