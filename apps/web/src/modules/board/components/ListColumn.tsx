'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@task-manager/types';
import type { List } from '@task-manager/types';
import TaskCard from '@/modules/board/components/TaskCard';
import CreateTaskForm from '@/modules/board/containers/CreateTaskForm';

interface ListColumnProps {
  list: List & { tasks: Task[] };
  boardId: string;
  onSelectTask?: (task: Task) => void;
  onStatusChange?: (task: Task, nextStatus: TaskStatus) => void;
  onDeleteList?: (listId: string) => void;
}

export default function ListColumn({
  list,
  boardId,
  onSelectTask,
  onStatusChange,
  onDeleteList,
}: ListColumnProps) {
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
        {onDeleteList && (
          <button
            type="button"
            title="Delete list"
            aria-label={`Delete list ${list.title}`}
            onClick={() => onDeleteList(list.id)}
            className="rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        )}
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
            <TaskCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
      </div>

      <CreateTaskForm listId={list.id} boardId={boardId} />
    </div>
  );
}
