'use client';

import { Skeleton } from '@task-manager/ui';

export default function CalendarSkeleton() {
  return (
    <div className="flex-1 p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 w-full rounded-none" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={`cell-${i}`} className="h-24 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
