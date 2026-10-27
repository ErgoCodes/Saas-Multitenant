import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrgRole } from '@task-manager/types';
import { PrismaService } from '../prisma/prisma.service';

const ROLE_WEIGHT: Record<OrgRole, number> = {
  [OrgRole.MEMBER]: 1,
  [OrgRole.ADMIN]: 2,
  [OrgRole.OWNER]: 3,
};

@Injectable()
export class BoardAccessService {
  constructor(private prisma: PrismaService) {}

  findMembership(userId: string, organizationId: string) {
    return this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
  }

  async assertOrgAccess(
    userId: string,
    organizationId: string,
    minRole: OrgRole = OrgRole.MEMBER,
  ) {
    const membership = await this.findMembership(userId, organizationId);
    if (!membership) {
      throw new ForbiddenException('Access denied: not a member of this organization');
    }
    const memberRole = membership.role as unknown as OrgRole;
    if (ROLE_WEIGHT[memberRole] < ROLE_WEIGHT[minRole]) {
      throw new ForbiddenException(`Access denied: requires ${minRole} role`);
    }
    return membership;
  }

  async assertBoardAccess(
    userId: string,
    boardId: string,
    minRole: OrgRole = OrgRole.MEMBER,
  ) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    await this.assertOrgAccess(userId, board.organizationId, minRole);
    return board;
  }

  async getBoardIdFromList(listId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true },
    });
    if (!list) throw new NotFoundException('List not found');
    return list.boardId;
  }
}
