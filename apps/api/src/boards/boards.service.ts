import { Injectable, BadRequestException } from '@nestjs/common';
import { OrgRole, WsEvent } from '@task-manager/types';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { BoardAccessService } from '../common/board-access.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private boardAccess: BoardAccessService,
  ) {}

  private async resolveOrganizationId(userId: string, requestedOrgId?: string): Promise<string> {
    if (requestedOrgId) {
      await this.boardAccess.assertOrgAccess(userId, requestedOrgId, OrgRole.MEMBER);
      return requestedOrgId;
    }
    const firstMembership = await this.prisma.organizationMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { organizationId: true },
    });
    if (!firstMembership) {
      throw new BadRequestException('User does not belong to any organization');
    }
    return firstMembership.organizationId;
  }

  async create(userId: string, dto: CreateBoardDto) {
    const organizationId = await this.resolveOrganizationId(userId, dto.organizationId);
    const board = await this.prisma.board.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId: userId,
        organizationId,
      },
      include: { lists: true },
    });
    return board;
  }

  async findAll(userId: string, organizationId?: string) {
    if (organizationId) {
      await this.boardAccess.assertOrgAccess(userId, organizationId, OrgRole.MEMBER);
      return this.prisma.board.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.board.findMany({
      where: {
        organization: {
          members: {
            some: { userId },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    await this.boardAccess.assertBoardAccess(userId, id, OrgRole.MEMBER);
    return this.prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateBoardDto) {
    await this.boardAccess.assertBoardAccess(userId, id, OrgRole.MEMBER);
    const updated = await this.prisma.board.update({
      where: { id },
      data: dto,
      include: { lists: true },
    });
    this.wsGateway.emitToBoard(id, WsEvent.BOARD_UPDATED, updated);
    return updated;
  }

  async delete(userId: string, id: string) {
    const board = await this.boardAccess.assertBoardAccess(userId, id, OrgRole.MEMBER);
    if (board.ownerId !== userId) {
      await this.boardAccess.assertOrgAccess(userId, board.organizationId, OrgRole.ADMIN);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { list: { boardId: id } } });
      await tx.list.deleteMany({ where: { boardId: id } });
      await tx.board.delete({ where: { id } });
    });
    this.wsGateway.emitToBoard(id, WsEvent.BOARD_DELETED, { id });
    return { id };
  }
}
