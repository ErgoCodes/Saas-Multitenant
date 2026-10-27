'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CreateTaskDto, Priority, TaskStatus } from '@task-manager/types';
import InlineTaskForm from '@/modules/board/components/InlineTaskForm';

export default function CreateTaskForm({
  listId,
  boardId,
}: {
  listId: string;
  boardId: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(Priority.MEDIUM);
  const [status, setStatus] = useState(TaskStatus.TODO);
  const [dueDate, setDueDate] = useState('');
  const queryClient = useQueryClient();

  const resetForm = () => {
    setOpen(false);
    setTitle('');
    setDescription('');
    setPriority(Priority.MEDIUM);
    setStatus(TaskStatus.TODO);
    setDueDate('');
  };

  const mutation = useMutation({
    mutationFn: (data: CreateTaskDto) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      resetForm();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title,
      description: description || undefined,
      priority,
      status,
      dueDate: dueDate || undefined,
      listId,
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/70 transition-all hover:bg-white/50 hover:text-muted-foreground"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Task
      </button>
    );
  }

  return (
    <InlineTaskForm
      title={title}
      setTitle={setTitle}
      description={description}
      setDescription={setDescription}
      priority={priority}
      setPriority={setPriority}
      status={status}
      setStatus={setStatus}
      dueDate={dueDate}
      setDueDate={setDueDate}
      loading={mutation.isPending}
      onSubmit={handleSubmit}
      onCancel={resetForm}
    />
  );
}
