import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Priority, TaskStatus } from '@task-manager/types';
import type { Task } from '@task-manager/types';
import { formatTaskDate } from '@/lib/date-utils';

interface TaskCardProps {
  task: Task;
  onSelect?: (task: Task) => void;
  onStatusChange?: (task: Task, nextStatus: TaskStatus) => void;
}

const priorityConfig: Record<Priority, { label: string; classes: string }> = {
  [Priority.LOW]: { label: 'Low', classes: 'bg-primary/10 text-primary' },
  [Priority.MEDIUM]: { label: 'Medium', classes: 'bg-accent/10 text-accent-foreground' },
  [Priority.HIGH]: { label: 'High', classes: 'bg-amber-500/15 text-amber-700' },
  [Priority.URGENT]: { label: 'Urgent', classes: 'bg-destructive/10 text-destructive' },
};

const statusConfig: Record<TaskStatus, { label: string; classes: string; next: TaskStatus }> = {
  [TaskStatus.TODO]: {
    label: 'To Do',
    classes: 'bg-secondary text-muted-foreground hover:bg-secondary/80',
    next: TaskStatus.IN_PROGRESS,
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    classes: 'bg-blue-500/15 text-blue-700 hover:bg-blue-500/25',
    next: TaskStatus.DONE,
  },
  [TaskStatus.DONE]: {
    label: 'Done',
    classes: 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25',
    next: TaskStatus.TODO,
  },
};

function TaskCardInner({ task, onStatusChange }: TaskCardProps) {
  const p = priorityConfig[task.priority];
  const s = statusConfig[task.status];

  return (
    <div className="rounded-xl bg-white">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4
          className={`font-medium text-foreground ${
            task.status === TaskStatus.DONE ? 'line-through opacity-60' : ''
          }`}
        >
          {task.title}
        </h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${p.classes}`}>
          {p.label}
        </span>
      </div>
      {task.description && (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          title="Click to cycle status"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(task, s.next);
          }}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-95 ${s.classes}`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {task.status === TaskStatus.DONE ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <circle cx="12" cy="12" r="10" />
            )}
          </svg>
          {s.label}
        </button>

        <div className="flex items-center gap-1.5">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatTaskDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <span
              title={`Assigned to ${task.assignee.name}`}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary"
            >
              {task.assignee.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function TaskCardView({ task }: TaskCardProps) {
  return <TaskCardInner task={task} />;
}

export default function TaskCard({ task, onSelect, onStatusChange }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect?.(task)}
      className={`cursor-grab rounded-xl bg-white p-4 shadow-sm transition-shadow duration-150 ease-out hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'z-50 ring-2 ring-ring opacity-90 shadow-md' : ''
      }`}
    >
      <TaskCardInner task={task} onStatusChange={onStatusChange} />
    </div>
  );
}
