'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Organization, OrganizationMember, OrgRole } from '@task-manager/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@task-manager/ui';

interface OrganizationMembersDialogProps {
  organization: Organization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrganizationMembersDialog({
  organization,
  open,
  onOpenChange,
}: OrganizationMembersDialogProps) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>(OrgRole.MEMBER);

  const canManageMembers =
    organization.role === OrgRole.OWNER || organization.role === OrgRole.ADMIN;

  const { data: members, isLoading } = useQuery({
    queryKey: ['organization-members', organization.id],
    queryFn: () =>
      api.get<OrganizationMember[]>(`/organizations/${organization.id}/members`),
    enabled: open,
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: { email: string; role: OrgRole }) =>
      api.post<OrganizationMember>(`/organizations/${organization.id}/members`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setEmail('');
      setRole(OrgRole.MEMBER);
      toast.success('Member added to organization');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to add member');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, nextRole }: { userId: string; nextRole: OrgRole }) =>
      api.patch(`/organizations/${organization.id}/members/${userId}`, { role: nextRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Member role updated');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/organizations/${organization.id}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', organization.id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Member removed');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    },
  });

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    addMemberMutation.mutate({ email: email.trim(), role });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{organization.name} — Members</DialogTitle>
          <DialogDescription>
            Collaborate on boards, lists, and tasks across this organization.
          </DialogDescription>
        </DialogHeader>

        {canManageMembers && (
          <form onSubmit={handleAddMember} className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
            <Label htmlFor="invite-email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Add Member by Email
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="flex-1"
              />
              <div className="w-32">
                <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={OrgRole.MEMBER}>Member</SelectItem>
                    <SelectItem value={OrgRole.ADMIN}>Admin</SelectItem>
                    <SelectItem value={OrgRole.OWNER}>Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" loading={addMemberMutation.isPending}>
                Add
              </Button>
            </div>
          </form>
        )}

        <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading members...</p>
          ) : (
            members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.user.name}
                    {member.userId === currentUser?.id && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {canManageMembers ? (
                    <>
                      <div className="w-28">
                        <Select
                          value={member.role}
                          onValueChange={(v) =>
                            updateRoleMutation.mutate({
                              userId: member.userId,
                              nextRole: v as OrgRole,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={OrgRole.OWNER}>Owner</SelectItem>
                            <SelectItem value={OrgRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={OrgRole.MEMBER}>Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <button
                        type="button"
                        title="Remove member"
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
