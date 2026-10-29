import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrgRole } from '@task-manager/types';
import { PrismaService } from '../prisma/prisma.service';
import { BoardAccessService } from '../common/board-access.service';
import { generateSlug } from '../common/slug';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AddOrganizationMemberDto } from './dto/add-member.dto';
import { UpdateOrganizationMemberDto } from './dto/update-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private boardAccess: BoardAccessService,
    private wsGateway: WebsocketGateway,
  ) {}

  async findAllForUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      memberCount: m.organization._count.members,
      createdAt: m.organization.createdAt,
      updatedAt: m.organization.updatedAt,
    }));
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = generateSlug(dto.name);
      try {
        const org = await this.prisma.organization.create({
          data: {
            name: dto.name.trim(),
            slug,
            members: {
              create: {
                userId,
                role: 'OWNER',
              },
            },
          },
        });
        return {
          ...org,
          role: OrgRole.OWNER,
          memberCount: 1,
        };
      } catch (err: any) {
        if (err?.code === 'P2002' && attempt < 2) {
          continue;
        }
        if (err?.code === 'P2002') {
          throw new ConflictException('Organization slug already exists');
        }
        throw err;
      }
    }
    throw new ConflictException('Could not generate a unique organization slug');
  }

  async findMembers(userId: string, organizationId: string) {
    await this.boardAccess.assertOrgAccess(userId, organizationId, OrgRole.MEMBER);
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMember(
    userId: string,
    organizationId: string,
    dto: AddOrganizationMemberDto,
  ) {
    const actorMembership = await this.boardAccess.assertOrgAccess(
      userId,
      organizationId,
      OrgRole.ADMIN,
    );

    const requestedRole = dto.role ?? OrgRole.MEMBER;
    if (requestedRole === OrgRole.OWNER && actorMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only an organization owner can assign the OWNER role');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: dto.email.trim(),
          mode: 'insensitive',
        },
      },
      select: { id: true, email: true, name: true },
    });
    if (!targetUser) {
      throw new NotFoundException(`No registered user found with email ${dto.email}`);
    }

    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUser.id },
      },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: targetUser.id,
        role: requestedRole,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateMemberRole(
    userId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateOrganizationMemberDto,
  ) {
    const actorMembership = await this.boardAccess.assertOrgAccess(
      userId,
      organizationId,
      OrgRole.ADMIN,
    );

    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Member not found in organization');
    }

    if (
      (existing.role === 'OWNER' || dto.role === OrgRole.OWNER) &&
      actorMembership.role !== 'OWNER'
    ) {
      throw new ForbiddenException(
        'Only an organization owner can grant or modify the OWNER role',
      );
    }

    if (existing.role === 'OWNER' && dto.role !== OrgRole.OWNER) {
      const ownerCount = await this.prisma.organizationMember.count({
        where: { organizationId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot downgrade the last owner of an organization');
      }
    }

    return this.prisma.organizationMember.update({
      where: { id: existing.id },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async removeMember(userId: string, organizationId: string, targetUserId: string) {
    const actorMembership = await this.boardAccess.assertOrgAccess(
      userId,
      organizationId,
      OrgRole.ADMIN,
    );

    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: targetUserId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Member not found in organization');
    }

    if (existing.role === 'OWNER') {
      if (actorMembership.role !== 'OWNER') {
        throw new ForbiddenException('Only an organization owner can remove another owner');
      }
      const ownerCount = await this.prisma.organizationMember.count({
        where: { organizationId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner of an organization');
      }
    }

    await this.prisma.$transaction([
      this.prisma.task.updateMany({
        where: {
          assigneeId: targetUserId,
          list: { board: { organizationId } },
        },
        data: { assigneeId: null },
      }),
      this.prisma.organizationMember.delete({ where: { id: existing.id } }),
    ]);

    const orgBoards = await this.prisma.board.findMany({
      where: { organizationId },
      select: { id: true },
    });
    this.wsGateway.evictUserFromRooms(
      targetUserId,
      orgBoards.map((b) => b.id),
    );

    return { userId: targetUserId };
  }
}
