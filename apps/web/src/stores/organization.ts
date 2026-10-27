import { create } from 'zustand';

interface OrganizationState {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
  clearOrganization: () => void;
}

function getInitialOrganizationId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('activeOrganizationId');
  }
  return null;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  activeOrganizationId: getInitialOrganizationId(),
  setActiveOrganizationId: (id) => {
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem('activeOrganizationId', id);
      } else {
        localStorage.removeItem('activeOrganizationId');
      }
    }
    set({ activeOrganizationId: id });
  },
  clearOrganization: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeOrganizationId');
    }
    set({ activeOrganizationId: null });
  },
}));
