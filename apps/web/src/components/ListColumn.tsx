'use client';

import { List, Task } from '@task-manager/types';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';

interface ListColumnProps {
  list: List & { tasks: Task[] };
  boardId: string;
  onTaskMove: (taskId: string, listId: string, order: number) => void;
  onListReorder: (listId: string, order: number) => void;
}

export default function ListColumn({ list, boardId, onTaskMove }: ListColumnProps) {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{list.title}</h3>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
          {list.tasks?.length || 0}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {list.tasks?.map((task) => (
          <TaskCard key={task.id} task={task} onMove={(listId, order) => onTaskMove(task.id, listId, order)} />
        ))}
      </div>
      <CreateTaskModal listId={list.id} boardId={boardId} />
    </div>
  );
}
