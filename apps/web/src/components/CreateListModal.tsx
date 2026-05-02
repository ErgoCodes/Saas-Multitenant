'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface CreateListModalProps {
  boardId: string;
}

export default function CreateListModal({ boardId }: CreateListModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post('/lists', { title, boardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setIsOpen(false);
      setTitle('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-72 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300"
        >
          + Add List
        </button>
      ) : (
        <div className="w-72 shrink-0 rounded-lg bg-gray-100 p-3">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="List title"
              className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2"
              autoFocus
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
