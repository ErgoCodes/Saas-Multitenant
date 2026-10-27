import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole } from '@task-manager/types';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  const mockPrisma: any = {
    $transaction: jest.fn((ops) => Promise.all(ops)),
    task: {
      updateMany: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    organizationMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    board: {
      findMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  };

  const mockBoardAccess = {
    assertOrgAccess: jest.fn(),
  };

  const mockWsGateway = {
    evictUserFromRooms: jest.fn(),
  };

  let service: OrganizationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganizationsService(
      mockPrisma as any,
      mockBoardAccess as any,
      mockWsGateway as any,
    );
  });

  it('adds an existing user by email (case-insensitive) with the requested role', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'OWNER' });
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-2',
      email: 'Demo@Example.com',
      name: 'Demo User',
    });
    mockPrisma.organizationMember.findUnique.mockResolvedValue(null);
    mockPrisma.organizationMember.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'm-2', ...data }),
    );

    const result = await service.addMember('user-1', 'org-1', {
      email: 'Demo@Example.com',
      role: OrgRole.ADMIN,
    });

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'Demo@Example.com',
          mode: 'insensitive',
        },
      },
      select: { id: true, email: true, name: true },
    });
    expect(result).toMatchObject({
      organizationId: 'org-1',
      userId: 'user-2',
      role: OrgRole.ADMIN,
    });
  });

  it('prevents an ADMIN from granting the OWNER role in addMember', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'ADMIN' });

    await expect(
      service.addMember('admin-1', 'org-1', {
        email: 'demo@example.com',
        role: OrgRole.OWNER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents an ADMIN from promoting themselves or anyone to OWNER in updateMemberRole', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'ADMIN' });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: 'm-admin',
      role: 'ADMIN',
    });

    await expect(
      service.updateMemberRole('admin-1', 'org-1', 'admin-1', {
        role: OrgRole.OWNER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents an ADMIN from demoting or removing an OWNER', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'ADMIN' });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: 'm-owner',
      role: 'OWNER',
    });

    await expect(
      service.updateMemberRole('admin-1', 'org-1', 'owner-1', {
        role: OrgRole.MEMBER,
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(service.removeMember('admin-1', 'org-1', 'owner-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('evicts removed member sockets from all organization board rooms', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'OWNER' });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: 'm-2',
      role: 'MEMBER',
    });
    mockPrisma.organizationMember.delete.mockResolvedValue({});
    mockPrisma.board.findMany.mockResolvedValue([{ id: 'b-1' }, { id: 'b-2' }]);

    await service.removeMember('owner-1', 'org-1', 'user-2');

    expect(mockWsGateway.evictUserFromRooms).toHaveBeenCalledWith('user-2', [
      'b-1',
      'b-2',
    ]);
  });

  it('unassigns the removed member from tasks in the organization in the same transaction', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'OWNER' });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: 'm-2',
      role: 'MEMBER',
    });
    mockPrisma.organizationMember.delete.mockResolvedValue({});
    mockPrisma.task.updateMany.mockResolvedValue({ count: 5 });
    mockPrisma.board.findMany.mockResolvedValue([]);

    await service.removeMember('owner-1', 'org-1', 'user-2');

    expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
      where: {
        assigneeId: 'user-2',
        list: { board: { organizationId: 'org-1' } },
      },
      data: { assigneeId: null },
    });
    expect(mockPrisma.organizationMember.delete).toHaveBeenCalledWith({ where: { id: 'm-2' } });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('retries organization creation when a P2002 slug collision occurs', async () => {
    mockPrisma.organization.create
      .mockRejectedValueOnce({ code: 'P2002' })
      .mockResolvedValueOnce({
        id: 'org-1',
        name: 'Acme',
        slug: 'acme-retry',
      });

    const org = await service.create('user-1', { name: 'Acme' });
    expect(mockPrisma.organization.create).toHaveBeenCalledTimes(2);
    expect(org.slug).toBe('acme-retry');
  });

  it('throws NotFoundException when adding an unregistered email', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'OWNER' });
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.addMember('user-1', 'org-1', { email: 'ghost@example.com' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException when user is already a member', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'OWNER' });
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-2', email: 'demo@example.com' });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({ id: 'm-2' });

    await expect(
      service.addMember('user-1', 'org-1', { email: 'demo@example.com' }),
    ).rejects.toThrow(ConflictException);
  });

  it('prevents removing the last OWNER of an organization', async () => {
    mockBoardAccess.assertOrgAccess.mockResolvedValue({ role: 'OWNER' });
    mockPrisma.organizationMember.findUnique.mockResolvedValue({
      id: 'm-1',
      role: 'OWNER',
    });
    mockPrisma.organizationMember.count.mockResolvedValue(1);

    await expect(service.removeMember('user-1', 'org-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
