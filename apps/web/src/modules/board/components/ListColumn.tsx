'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '@task-manager/types';
import type { List } from '@task-manager/types';
import TaskCard from '@/modules/board/components/TaskCard';
import CreateTaskForm from '@/modules/board/containers/CreateTaskForm';

interface ListColumnProps {
  list: List & { tasks: Task[] };
  boardId: string;
}

export default function ListColumn({ list, boardId }: ListColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
    data: { type: 'list', list },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-secondary p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-secondary-foreground">{list.title}</h3>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted/80 px-1.5 text-xs font-medium text-muted-foreground">
            {list.tasks?.length || 0}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 rounded-lg transition-colors min-h-[60px] ${
          isOver ? 'bg-primary/10 ring-2 ring-ring/30' : ''
        }`}
      >
        <SortableContext
          items={list.tasks?.map((t: Task) => t.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {list.tasks?.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-xs text-muted-foreground/70">No tasks yet</p>
            </div>
          )}
          {list.tasks?.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      <CreateTaskForm listId={list.id} boardId={boardId} />
    </div>
  );
}
