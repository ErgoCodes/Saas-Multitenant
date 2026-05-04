'use client';

import { Button } from '@task-manager/ui';

interface CalendarErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function CalendarErrorState({ message, onRetry }: CalendarErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
        Failed to load calendar
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
