import type { ReactNode } from 'react';

interface DashboardHeaderProps {
  boardCount: number | undefined;
  children: ReactNode;
}

export default function DashboardHeader({ boardCount, children }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          My Boards
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {boardCount != null && boardCount > 0
            ? `You have ${boardCount} board${boardCount !== 1 ? 's' : ''}`
            : 'Create your first board to get started'}
        </p>
      </div>
      {children}
    </div>
  );
}
