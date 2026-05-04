'use client';

export default function CalendarEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
        No scheduled tasks yet
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tasks with due dates will appear here. Add due dates from your Kanban boards.
      </p>
    </div>
  );
}
