'use client';

import { getBoardColorStyle } from '@/lib/calendar-colors';

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    boardId: string;
    priority: string;
  };
  onClick?: (taskId: string) => void;
}

export default function TaskItem({ task, onClick }: TaskItemProps) {
  const colorStyle = getBoardColorStyle(task.boardId);

  return (
    <div
      className={`rounded border px-1.5 py-0.5 text-xs font-medium leading-tight truncate cursor-pointer transition-opacity hover:opacity-80 ${colorStyle}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(task.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(task.id);
        }
      }}
      aria-label={`${task.title}, priority ${task.priority}`}
    >
      {task.title}
    </div>
  );
}
