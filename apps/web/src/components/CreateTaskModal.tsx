'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Priority } from '@task-manager/types';
import { api } from '../lib/api';

interface CreateTaskModalProps {
  listId: string;
  boardId: string;
}

export default function CreateTaskModal({ listId, boardId }: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post('/tasks', { title, description, priority, listId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      setIsOpen(false);
      setTitle('');
      setDescription('');
      setPriority(Priority.MEDIUM);
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
          className="mt-2 w-full rounded-md py-1.5 text-left text-sm text-gray-500 hover:bg-gray-200"
        >
          + Add Task
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-2 rounded-md bg-white p-2 shadow-sm">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            autoFocus
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            rows={2}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="mb-2 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          >
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </>
  );
}
