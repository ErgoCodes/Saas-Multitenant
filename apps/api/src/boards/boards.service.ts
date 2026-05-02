import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { WsEvent } from '@task-manager/types';

@Injectable()
export class BoardsService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
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
    this.wsGateway.emitToBoard(board.id, WsEvent.BOARD_CREATED, board);
    return board;
  }

  async findAll(userId: string) {
    return this.prisma.board.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const board = await this.prisma.board.findUnique({
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
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
    return board;
  }

  async update(userId: string, id: string, dto: UpdateBoardDto) {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
    const updated = await this.prisma.board.update({
      where: { id },
      data: dto,
      include: { lists: true },
    });
    this.wsGateway.emitToBoard(id, WsEvent.BOARD_UPDATED, updated);
    return updated;
  }

  async delete(userId: string, id: string) {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.board.delete({ where: { id } });
    this.wsGateway.emitToBoard(id, WsEvent.BOARD_DELETED, { id });
    return { id };
  }
}
