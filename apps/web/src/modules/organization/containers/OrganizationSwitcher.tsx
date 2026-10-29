'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useOrganizationStore } from '@/stores/organization';
import { Organization } from '@task-manager/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
} from '@task-manager/ui';
import { Users, Plus } from 'lucide-react';
import OrganizationMembersDialog from './OrganizationMembersDialog';

export default function OrganizationSwitcher() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeOrganizationId, setActiveOrganizationId } = useOrganizationStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const [createOpen, setCreateOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get<Organization[]>('/organizations'),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!organizations || organizations.length === 0) return;
    const exists = organizations.some((org) => org.id === activeOrganizationId);
    if (!activeOrganizationId || !exists) {
      setActiveOrganizationId(organizations[0].id);
    }
  }, [organizations, activeOrganizationId, setActiveOrganizationId]);

  const createOrgMutation = useMutation({
    mutationFn: (name: string) => api.post<Organization>('/organizations', { name }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setActiveOrganizationId(created.id);
      setCreateOpen(false);
      setNewOrgName('');
      toast.success(`Organization "${created.name}" created`);
      if (pathname.startsWith('/boards/')) {
        router.push('/dashboard');
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization');
    },
  });

  const activeOrg = organizations?.find((org) => org.id === activeOrganizationId);

  function handleSwitchOrg(orgId: string) {
    setActiveOrganizationId(orgId);
    if (pathname.startsWith('/boards/')) {
      router.push('/dashboard');
    }
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    createOrgMutation.mutate(newOrgName.trim());
  }

  if (!organizations || organizations.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="w-52">
        <Select value={activeOrganizationId ?? undefined} onValueChange={handleSwitchOrg}>
          <SelectTrigger className="h-9 text-xs font-medium">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name} ({org.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeOrg && (
        <button
          type="button"
          onClick={() => setMembersOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border/80 bg-background px-2.5 text-xs font-medium text-muted-foreground shadow-2xs transition-[background-color,color,transform] duration-150 hover:bg-secondary hover:text-foreground active:scale-95"
          title="Manage organization members"
        >
          <Users className="h-3.5 w-3.5" />
          <span>Members ({activeOrg.memberCount ?? 1})</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/80 bg-background text-muted-foreground shadow-2xs transition-[background-color,color,transform] duration-150 hover:bg-secondary hover:text-foreground active:scale-95"
        title="New organization"
        aria-label="Create new organization"
      >
        <Plus className="h-4 w-4" />
      </button>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g. Acme Engineering"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={createOrgMutation.isPending}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {activeOrg && (
        <OrganizationMembersDialog
          organization={activeOrg}
          open={membersOpen}
          onOpenChange={setMembersOpen}
        />
      )}
    </div>
  );
}
