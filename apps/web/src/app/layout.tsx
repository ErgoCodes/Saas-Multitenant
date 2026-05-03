import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
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
      <body className="min-h-screen bg-surface-50 font-body text-surface-700 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
