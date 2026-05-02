import { Task, Priority, TaskStatus } from '@task-manager/types';

interface TaskCardProps {
  task: Task;
  onMove: (listId: string, order: number) => void;
}

const priorityColors: Record<Priority, string> = {
  [Priority.LOW]: 'bg-green-100 text-green-800',
  [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
  [Priority.HIGH]: 'bg-orange-100 text-orange-800',
  [Priority.URGENT]: 'bg-red-100 text-red-800',
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'To Do',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Done',
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="rounded-md bg-white p-3 shadow-sm hover:shadow-md">
      <h4 className="font-medium text-gray-900">{task.title}</h4>
      {task.description && <p className="mt-1 text-xs text-gray-600">{task.description}</p>}
      <div className="mt-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {statusLabels[task.status]}
        </span>
      </div>
    </div>
  );
}
