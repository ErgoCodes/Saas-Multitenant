'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useOrganizationStore } from '@/stores/organization';
import { Organization } from '@task-manager/types';

/**
 * The persisted active organization id may be stale (e.g. the user was removed).
 * `isReady` is true only once the id has been checked against the user's memberships,
 * so org-scoped queries don't fire with an invalid or missing id.
 */
export function useActiveOrganization() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const activeOrganizationId = useOrganizationStore((s) => s.activeOrganizationId);

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Organization[]>('/organizations'),
    enabled: isAuthenticated,
  });

  const isReady =
    !!organizations &&
    (organizations.length === 0 || organizations.some((org) => org.id === activeOrganizationId));

  return { activeOrganizationId, isReady };
}
