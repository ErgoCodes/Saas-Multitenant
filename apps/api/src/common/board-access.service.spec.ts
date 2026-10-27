import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrgRole } from '@task-manager/types';
import { BoardAccessService } from './board-access.service';

describe('BoardAccessService (Multi-Tenant RBAC)', () => {
  const mockPrisma = {
    organizationMember: {
      findUnique: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
    },
    list: {
      findUnique: jest.fn(),
    },
  };

  let service: BoardAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BoardAccessService(mockPrisma as any);
  });

  describe('findMembership', () => {
    it('returns null instead of throwing when the user is not a member', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(service.findMembership('user-9', 'org-1')).resolves.toBeNull();
      expect(mockPrisma.organizationMember.findUnique).toHaveBeenCalledWith({
        where: { organizationId_userId: { organizationId: 'org-1', userId: 'user-9' } },
      });
    });
  });

  describe('assertOrgAccess', () => {
    it('allows access when user has required role or higher', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        id: 'm-1',
        organizationId: 'org-1',
        userId: 'user-1',
        role: 'ADMIN',
      });

      const membership = await service.assertOrgAccess('user-1', 'org-1', OrgRole.MEMBER);
      expect(membership.role).toBe('ADMIN');
    });

    it('throws ForbiddenException when user is not a member of the organization', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.assertOrgAccess('user-outsider', 'org-1', OrgRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when MEMBER attempts an ADMIN-restricted action', async () => {
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        id: 'm-1',
        organizationId: 'org-1',
        userId: 'user-1',
        role: 'MEMBER',
      });

      await expect(
        service.assertOrgAccess('user-1', 'org-1', OrgRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertBoardAccess', () => {
    it('throws NotFoundException when board does not exist', async () => {
      mockPrisma.board.findUnique.mockResolvedValue(null);

      await expect(service.assertBoardAccess('user-1', 'missing-board')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('verifies membership in the board organization', async () => {
      mockPrisma.board.findUnique.mockResolvedValue({
        id: 'board-1',
        organizationId: 'org-1',
      });
      mockPrisma.organizationMember.findUnique.mockResolvedValue({
        id: 'm-1',
        organizationId: 'org-1',
        userId: 'user-1',
        role: 'MEMBER',
      });

      const board = await service.assertBoardAccess('user-1', 'board-1', OrgRole.MEMBER);
      expect(board.id).toBe('board-1');
    });
  });
});
