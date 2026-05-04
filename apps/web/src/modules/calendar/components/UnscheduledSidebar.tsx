'use client';

import { useState, useRef, useEffect } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import type { Task } from '@task-manager/types';

interface UnscheduledSidebarProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export default function UnscheduledSidebar({ tasks, onTaskClick }: UnscheduledSidebarProps) {
  const [open, setOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !containerRef.current || tasks.length === 0) return;

    const draggable = new Draggable(containerRef.current, {
      itemSelector: '[data-event]',
    });

    return () => {
      // FullCalendar Draggable has no explicit destroy in v6;
      // listeners are cleaned up when the DOM node is removed.
      void draggable;
    };
  }, [open, tasks.length]);

  return (
    <div className={`border-l border-border bg-background transition-all duration-200 ${open ? 'w-[280px]' : 'w-[40px]'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        aria-label={open ? 'Collapse unscheduled panel' : 'Expand unscheduled panel'}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} />
        </svg>
        {open && <span>Unscheduled</span>}
        {open && tasks.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">{tasks.length}</span>
        )}
      </button>

      {open && (
        <div ref={containerRef} className="overflow-y-auto px-2 pb-4">
          {tasks.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No unscheduled tasks
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  data-event={JSON.stringify({ id: task.id, title: task.title, extendedProps: { taskId: task.id } })}
                  className="cursor-grab rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm transition-shadow hover:shadow-md"
                  onClick={() => onTaskClick(task.id)}
                >
                  <p className="truncate text-foreground">{task.title}</p>
                  {task.priority && (
                    <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
