import Link from 'next/link';
import { Board } from '@task-manager/types';
import { ArrowRight, LayoutDashboard, Trash2 } from 'lucide-react';

interface BoardCardProps {
  board: Board;
  onDelete: () => void;
}

export default function BoardCard({ board, onDelete }: BoardCardProps) {
  return (
    <div className="group relative flex min-h-[175px] flex-col justify-between rounded-xl border border-border/80 bg-white p-5 shadow-xs transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]">
      <Link href={`/boards/${board.id}`} className="block">
        <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/15 bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-xs">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
          {board.title}
        </h3>
        {board.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {board.description}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground/50 italic">
            No description
          </p>
        )}
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs">
        <Link
          href={`/boards/${board.id}`}
          className="inline-flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary/80"
        >
          Open board
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <span className="text-[11px] font-medium text-muted-foreground/70">
          Board
        </span>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-muted-foreground/60 opacity-0 transition-[background-color,color,opacity,transform] duration-150 ease-out hover:bg-destructive/10 hover:text-destructive active:scale-90 group-hover:opacity-100 focus:opacity-100"
        title="Delete board"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
