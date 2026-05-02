'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth';
import { connectSocket, disconnectSocket } from '../lib/socket';

export function useSocket() {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, [token]);
}
