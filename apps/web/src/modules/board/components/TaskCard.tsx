import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Priority, TaskStatus } from '@task-manager/types';
import type { Task } from '@task-manager/types';

interface TaskCardProps {
  task: Task;
}

const priorityConfig: Record<Priority, { label: string; classes: string }> = {
  [Priority.LOW]: { label: 'Low', classes: 'bg-primary/10 text-primary' },
  [Priority.MEDIUM]: { label: 'Medium', classes: 'bg-accent/10 text-accent-foreground' },
  [Priority.HIGH]: { label: 'High', classes: 'bg-accent/10 text-accent-foreground' },
  [Priority.URGENT]: { label: 'Urgent', classes: 'bg-destructive/10 text-destructive' },
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
};

function TaskCardInner({ task }: TaskCardProps) {
  const p = priorityConfig[task.priority];

  return (
    <div className="rounded-xl bg-white  ">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-medium text-foreground">{task.title}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${p.classes}`}>
          {p.label}
        </span>
      </div>
      {task.description && (
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
          </svg>
          {statusLabels[task.status]}
        </span>
      </div>
    </div>
  );
}

export function TaskCardView({ task }: TaskCardProps) {
  return <TaskCardInner task={task} />;
}

export default function TaskCard({ task }: TaskCardProps) {
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
      className={`cursor-grab rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md active:cursor-grabbing ${
        isDragging ? 'z-50 ring-2 ring-ring opacity-90 shadow-md' : ''
      }`}
    >
      <TaskCardView task={task} />
    </div>
  );
}
