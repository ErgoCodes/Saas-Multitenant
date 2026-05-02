'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../lib/api';
import { Board, List, Task, Priority, TaskStatus } from '@task-manager/types';
import Header from '../../components/Header';
import ListColumn from '../../components/ListColumn';
import CreateListModal from '../../components/CreateListModal';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [boardId, setBoardId] = useState<string>('');

  useEffect(() => {
    params.then((p) => setBoardId(p.id));
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => api.get<Board & { lists: (List & { tasks: Task[] })[] }>(`/boards/${boardId}`),
    enabled: !!boardId && isAuthenticated,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/tasks/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/lists/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board', boardId] }),
  });

  const handleTaskMove = (taskId: string, listId: string, order: number) => {
    updateTaskMutation.mutate({ id: taskId, data: { listId, order } });
  };

  const handleListReorder = (listId: string, order: number) => {
    updateListMutation.mutate({ id: listId, data: { order } });
  };

  if (!isAuthenticated) return null;

  return (
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
                  onListReorder={handleListReorder}
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
  );
}
