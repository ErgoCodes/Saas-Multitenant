'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../lib/api';
import { Board } from '@task-manager/types';
import Header from '../../components/Header';
import BoardCard from '../../components/BoardCard';
import CreateBoardModal from '../../components/CreateBoardModal';

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: () => api.get<Board[]>('/boards'),
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/boards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
          <CreateBoardModal />
        </div>
        {isLoading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards?.map((board) => (
              <BoardCard key={board.id} board={board} onDelete={() => deleteMutation.mutate(board.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
