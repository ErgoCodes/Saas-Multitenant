import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { BoardAccessService } from '../common/board-access.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { WsEvent } from '@task-manager/types';

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private boardAccess: BoardAccessService,
  ) {}

  async create(userId: string, dto: CreateListDto) {
    await this.boardAccess.assertOwnership(userId, dto.boardId);
    const list = await this.prisma.list.create({
      data: {
        title: dto.title,
        boardId: dto.boardId,
      },
      include: { tasks: true },
    });
    this.wsGateway.emitToBoard(dto.boardId, WsEvent.LIST_CREATED, list);
    return list;
  }

  async findByBoard(userId: string, boardId: string) {
    await this.boardAccess.assertOwnership(userId, boardId);
    return this.prisma.list.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateListDto) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      select: { boardId: true },
    });
    if (!list) throw new Error('List not found');
    await this.boardAccess.assertOwnership(userId, list.boardId);
    const updated = await this.prisma.list.update({
      where: { id },
      data: dto,
      include: { tasks: true },
    });
    this.wsGateway.emitToBoard(list.boardId, WsEvent.LIST_UPDATED, updated);
    return updated;
  }

  async delete(userId: string, id: string) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      select: { boardId: true },
    });
    if (!list) throw new Error('List not found');
    await this.boardAccess.assertOwnership(userId, list.boardId);
    await this.prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({ where: { listId: id } });
      await tx.list.delete({ where: { id } });
    });
    this.wsGateway.emitToBoard(list.boardId, WsEvent.LIST_DELETED, { id });
    return { id };
  }
}
