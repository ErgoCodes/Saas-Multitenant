'use client';

import { use } from 'react';
import AuthGuard from '@/modules/auth/containers/AuthGuard';
import AppHeader from '@/modules/layout/containers/AppHeader';
import BoardView from '@/modules/board/containers/BoardView';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <BoardView boardId={boardId} />
      </div>
    </AuthGuard>
  );
}
