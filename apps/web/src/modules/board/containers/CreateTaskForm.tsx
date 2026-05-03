'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Priority } from '@task-manager/types';
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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { title: string; description?: string; priority: Priority; listId: string }) =>
      api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setOpen(false);
      setTitle('');
      setDescription('');
      setPriority(Priority.MEDIUM);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, description: description || undefined, priority, listId });
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
      loading={mutation.isPending}
      onSubmit={handleSubmit}
      onCancel={() => {
        setOpen(false);
        setTitle('');
        setDescription('');
        setPriority(Priority.MEDIUM);
      }}
    />
  );
}
