import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { WsEvent } from '@task-manager/types';

@Injectable()
export class ListsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  async create(userId: string, dto: CreateListDto) {
    const board = await this.prisma.board.findUnique({ where: { id: dto.boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
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
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
    return this.prisma.list.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateListDto) {
    const list = await this.prisma.list.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!list) throw new NotFoundException('List not found');
    if (list.board.ownerId !== userId) throw new ForbiddenException('Access denied');
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
      include: { board: true },
    });
    if (!list) throw new NotFoundException('List not found');
    if (list.board.ownerId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.list.delete({ where: { id } });
    this.wsGateway.emitToBoard(list.boardId, WsEvent.LIST_DELETED, { id });
    return { id };
  }
}
