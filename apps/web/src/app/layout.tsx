import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import { Toaster } from '@task-manager/ui';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Task Manager',
    template: '%s | Task Manager',
  },
  description: 'Collaborative task management made simple. Organize projects, track progress, and ship faster with your team.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
