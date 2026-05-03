'use client';

import { useAuthStore } from '@/stores/auth';
import Header from '@/modules/layout/components/Header';

export default function AppHeader() {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) return null;

  return <Header user={user} onLogout={logout} />;
}
