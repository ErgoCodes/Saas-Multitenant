import Link from 'next/link';
import { Board } from '@task-manager/types';

interface BoardCardProps {
  board: Board;
  onDelete: () => void;
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  return (
    <div className="group relative rounded-xl bg-white p-5 shadow-card transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
      <Link href={`/boards/${board.id}`} className="block">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
          </svg>
        </div>
        <h3 className="font-heading font-semibold text-surface-900">{board.title}</h3>
        {board.description && (
          <p className="mt-1 line-clamp-2 text-sm text-surface-500">{board.description}</p>
        )}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-surface-400 opacity-0 transition-all hover:bg-danger-50 hover:text-danger-600 group-hover:opacity-100 focus:opacity-100"
        title="Delete board"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
