'use client';

import { useAuthStore } from '@/stores/auth';
import Link from 'next/link';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 font-heading text-lg font-bold tracking-tight text-surface-900"
        >
          <span className="text-brand-600">task</span>flow
        </Link>
        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-surface-500">{user.name}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
