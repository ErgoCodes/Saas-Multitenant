import AuthGuard from '@/modules/auth/containers/AuthGuard';
import AppHeader from '@/modules/layout/containers/AppHeader';
import BoardGrid from '@/modules/dashboard/containers/BoardGrid';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppHeader />
      <BoardGrid />
    </AuthGuard>
  );
}
