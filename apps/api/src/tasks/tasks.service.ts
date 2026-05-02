import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WsEvent } from '@task-manager/types';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
  ) {}

  private async assertBoardAccess(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
  }

  private async getListBoardId(listId: string) {
    const list = await this.prisma.list.findUnique({ where: { id: listId }, include: { board: true } });
    if (!list) throw new NotFoundException('List not found');
    return list.boardId;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const boardId = await this.getListBoardId(dto.listId);
    await this.assertBoardAccess(userId, boardId);
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        listId: dto.listId,
      },
    });
    this.wsGateway.emitToBoard(boardId, WsEvent.TASK_CREATED, task);
    return task;
  }

  async findByList(userId: string, listId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      include: { board: true },
    });
    if (!list) throw new NotFoundException('List not found');
    await this.assertBoardAccess(userId, list.boardId);
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { order: 'asc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertBoardAccess(userId, task.list.boardId);

    const originalListId = task.listId;
    const updated = await this.prisma.task.update({
      where: { id },
      data: dto,
    });

    const boardId = task.list.boardId;
    if (dto.listId && dto.listId !== originalListId) {
      this.wsGateway.emitToBoard(boardId, WsEvent.TASK_MOVED, updated);
    }
    this.wsGateway.emitToBoard(boardId, WsEvent.TASK_UPDATED, updated);
    return updated;
  }

  async delete(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertBoardAccess(userId, task.list.boardId);
    await this.prisma.task.delete({ where: { id } });
    this.wsGateway.emitToBoard(task.list.boardId, WsEvent.TASK_DELETED, { id });
    return { id };
  }
}
