import { create } from 'zustand';
import { User } from '@task-manager/types';
import { useOrganizationStore } from './organization';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

function getInitialState(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated'> {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      return { user, token, isAuthenticated: true };
    }
  }
  return { user: null, token: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    useOrganizationStore.getState().clearOrganization();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
