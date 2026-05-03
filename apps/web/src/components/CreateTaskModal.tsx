'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Priority } from '@task-manager/types';
import { Button, Input, Textarea, Select } from '@task-manager/ui';

export default function CreateTaskModal({
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
        className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-400 transition-all hover:bg-white/50 hover:text-surface-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl bg-white p-4 shadow-card">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        autoFocus
        required
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
      />
      <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          options={Object.values(Priority).map((p: string) => ({
            value: p,
            label: p.charAt(0) + p.slice(1).toLowerCase(),
          }))}
        />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={mutation.isPending}>
          Add Task
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setTitle('');
            setDescription('');
            setPriority(Priority.MEDIUM);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
