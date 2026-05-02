import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { BoardAccessService } from '../common/board-access.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { WsEvent } from '@task-manager/types';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private wsGateway: WebsocketGateway,
    private boardAccess: BoardAccessService,
  ) {}

  async create(userId: string, dto: CreateTaskDto) {
    const boardId = await this.boardAccess.getBoardIdFromList(dto.listId);
    await this.boardAccess.assertOwnership(userId, boardId);
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
    const boardId = await this.boardAccess.getBoardIdFromList(listId);
    await this.boardAccess.assertOwnership(userId, boardId);
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { order: 'asc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.boardAccess.assertOwnership(userId, task.list.boardId);

    if (dto.listId) {
      const targetBoardId = await this.boardAccess.getBoardIdFromList(dto.listId);
      if (targetBoardId !== task.list.boardId) {
        throw new ForbiddenException('Cannot move task to a different board');
      }
    }

    const originalListId = task.listId;
    const updated = await this.prisma.task.update({
      where: { id },
      data: dto,
    });

    const boardId = task.list.boardId;
    if (dto.listId && dto.listId !== originalListId) {
      this.wsGateway.emitToBoard(boardId, WsEvent.TASK_MOVED, updated);
    } else {
      this.wsGateway.emitToBoard(boardId, WsEvent.TASK_UPDATED, updated);
    }
    return updated;
  }

  async delete(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.boardAccess.assertOwnership(userId, task.list.boardId);
    await this.prisma.task.delete({ where: { id } });
    this.wsGateway.emitToBoard(task.list.boardId, WsEvent.TASK_DELETED, { id });
    return { id };
  }
}
