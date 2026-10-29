'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { TooltipProvider } from '@task-manager/ui';
import { useSocket } from '@/hooks/useSocket';

function SocketProvider({ children }: { children: ReactNode }) {
  useSocket();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200} skipDelayDuration={300}>
        <SocketProvider>{children}</SocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
