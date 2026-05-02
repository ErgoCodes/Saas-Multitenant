import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { BoardAccessService } from '../common/board-access.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { WsEvent } from '@task-manager/types';

@Injectable()
export class BoardsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private boardAccess: BoardAccessService,
  ) {}

  async create(userId: string, dto: CreateBoardDto) {
    const board = await this.prisma.board.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId: userId,
      },
      include: { lists: true },
    });
    return board;
  }

  async findAll(userId: string) {
    return this.prisma.board.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    await this.boardAccess.assertOwnership(userId, id);
    return this.prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateBoardDto) {
    await this.boardAccess.assertOwnership(userId, id);
    const updated = await this.prisma.board.update({
      where: { id },
      data: dto,
      include: { lists: true },
    });
    this.wsGateway.emitToBoard(id, WsEvent.BOARD_UPDATED, updated);
    return updated;
  }

  async delete(userId: string, id: string) {
    await this.boardAccess.assertOwnership(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { list: { boardId: id } } });
      await tx.list.deleteMany({ where: { boardId: id } });
      await tx.board.delete({ where: { id } });
    });
    this.wsGateway.emitToBoard(id, WsEvent.BOARD_DELETED, { id });
    return { id };
  }
}
