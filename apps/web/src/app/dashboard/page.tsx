'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { Board } from '@task-manager/types';
import Header from '@/components/Header';
import BoardCard from '@/components/BoardCard';
import CreateBoardModal from '@/components/CreateBoardModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Spinner, Skeleton } from '@task-manager/ui';

export default function DashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const {
    data: boards,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/boards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-surface-50">
        <Header />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-surface-900">
                My Boards
              </h1>
              <p className="mt-1 text-sm text-surface-500">
                {boards?.length
                  ? `You have ${boards.length} board${boards.length !== 1 ? 's' : ''}`
                  : 'Create your first board to get started'}
              </p>
            </div>
            <CreateBoardModal />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-white p-5 shadow-card">
                  <Skeleton className="mb-3 h-5 w-3/4" />
                  <Skeleton className="mb-4 h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-100 text-danger-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-surface-900">
                Failed to load boards
              </h3>
              <p className="mt-1 text-sm text-surface-500">Something went wrong. Please try again.</p>
            </div>
          ) : boards?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-surface-900">
                No boards yet
              </h3>
              <p className="mt-1 text-sm text-surface-500">
                Create your first board and start organizing your tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards?.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onDelete={() => deleteMutation.mutate(board.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
