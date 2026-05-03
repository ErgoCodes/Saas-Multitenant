'use client';

import Link from 'next/link';

interface HeaderUser {
  name: string;
}

interface HeaderProps {
  user: HeaderUser | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 font-heading text-lg font-bold tracking-tight text-foreground"
        >
          <span className="text-primary">task</span>flow
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <button
              onClick={onLogout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
