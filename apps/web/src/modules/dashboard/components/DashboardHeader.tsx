import type { ReactNode } from 'react';

interface DashboardHeaderProps {
  boardCount: number | undefined;
  children: ReactNode;
}

export default function DashboardHeader({ boardCount, children }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My Boards
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {boardCount != null && boardCount > 0
            ? `You have ${boardCount} board${boardCount !== 1 ? 's' : ''} in this workspace`
            : 'Create your first board to get started'}
        </p>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
