import AuthGuard from '@/modules/auth/containers/AuthGuard';
import AppHeader from '@/modules/layout/containers/AppHeader';
import CalendarView from '@/modules/calendar/containers/CalendarView';

export default function CalendarPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <CalendarView />
      </div>
    </AuthGuard>
  );
}
