'use client';

import { use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AuthGuard from '@/modules/auth/containers/AuthGuard';
import AppHeader from '@/modules/layout/containers/AppHeader';
import BoardView from '@/modules/board/containers/BoardView';
import BoardCalendarView from '@/modules/board/containers/BoardCalendarView';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view') === 'calendar' ? 'calendar' : 'kanban';

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <div className="flex items-center justify-end gap-2 border-b border-border px-6 py-2">
          <button
            onClick={() => router.push(`/boards/${boardId}`)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'kanban'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => router.push(`/boards/${boardId}?view=calendar`)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'calendar'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Calendar
          </button>
        </div>
        {view === 'calendar' ? (
          <BoardCalendarView boardId={boardId} />
        ) : (
          <BoardView boardId={boardId} />
        )}
      </div>
    </AuthGuard>
  );
}
