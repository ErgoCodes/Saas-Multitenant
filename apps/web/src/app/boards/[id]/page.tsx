'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { WsEvent } from '@task-manager/types';
import { Board, List, Task } from '@task-manager/types';
import Header from '../../components/Header';
import ListColumn from '../../components/ListColumn';
import CreateListModal from '../../components/CreateListModal';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.get<Board & { lists: (List & { tasks: Task[] })[] }>(`/boards/${boardId}`),
    enabled: isAuthenticated,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => api.patch(`/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { order?: number } }) => api.patch(`/lists/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const handleTaskMove = (taskId: string, listId: string, order: number) => {
    updateTaskMutation.mutate({ id: taskId, data: { listId, order } });
  };

  const handleListReorder = (listId: string, order: number) => {
    updateListMutation.mutate({ id: listId, data: { order } });
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-blue-50">
        <Header />
        <main className="flex-1 overflow-x-auto p-4">
          {isLoading ? (
            <p className="text-gray-600">Loading board...</p>
          ) : board ? (
            <>
              <div className="mb-4">
                <h1 className="text-xl font-bold text-gray-900">{board.title}</h1>
                {board.description && <p className="text-sm text-gray-600">{board.description}</p>}
              </div>
              <div className="flex gap-4">
                {board.lists?.map((list) => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    boardId={boardId}
                    onTaskMove={handleTaskMove}
                  />
                ))}
                <CreateListModal boardId={boardId} />
              </div>
            </>
          ) : (
            <p className="text-gray-600">Board not found</p>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
