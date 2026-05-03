'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button, Input } from '@task-manager/ui';

export default function CreateListModal({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { title: string; boardId: string }) => api.post('/lists', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setOpen(false);
      setTitle('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, boardId });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-72 shrink-0 items-center gap-0 rounded-xl border-2 border-dashed border-surface-300 p-4 text-sm font-medium text-surface-400 transition-all hover:border-brand-400 hover:text-brand-600 justify-center"
      >
          <svg className="h-4 w-4 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add List
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-surface-100 p-4"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="List title"
        autoFocus
        required
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={mutation.isPending}>
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setTitle('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
