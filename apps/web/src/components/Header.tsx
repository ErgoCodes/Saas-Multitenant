'use client';

import { useAuthStore } from '../stores/auth';
import Link from 'next/link';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/dashboard" className="text-lg font-bold text-blue-600">
          Task Manager
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <>
              <span className="text-sm text-gray-700">{user.name}</span>
              <button
                onClick={logout}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
