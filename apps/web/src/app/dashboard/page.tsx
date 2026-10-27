import AuthGuard from '@/modules/auth/containers/AuthGuard';
import AppHeader from '@/modules/layout/containers/AppHeader';
import BoardGrid from '@/modules/dashboard/containers/BoardGrid';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-slate-50/60">
        <AppHeader />
        <BoardGrid />
      </div>
    </AuthGuard>
  );
}
