import Link from 'next/link';
import { Board } from '@task-manager/types';

interface BoardCardProps {
  board: Board;
  onDelete: () => void;
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  return (
    <div className="group relative rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/boards/${board.id}`}>
        <h3 className="text-lg font-semibold text-gray-900">{board.title}</h3>
        {board.description && <p className="mt-1 text-sm text-gray-600">{board.description}</p>}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
