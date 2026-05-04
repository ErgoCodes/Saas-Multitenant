import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { BoardAccessService } from '../common/board-access.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CalendarQueryDto } from './dto/calendar-query.dto';
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
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
    this.wsGateway.emitToBoard(boardId, WsEvent.TASK_CREATED, task);
    return task;
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.boardAccess.assertOwnership(userId, task.list.boardId);
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

  async findByDateRange(userId: string, query: CalendarQueryDto) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    const where: Record<string, unknown> = {
      list: {
        board: {
          ownerId: userId,
        },
      },
    };

    if (!query.includeUnscheduled) {
      where.dueDate = { gte: start, lte: end };
    } else {
      where.OR = [
        { dueDate: { gte: start, lte: end } },
        { dueDate: null },
      ];
    }

    if (query.boardId) {
      (where.list as Record<string, unknown>).board = {
        ...((where.list as Record<string, unknown>).board as Record<string, unknown>),
        id: query.boardId,
      };
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        list: {
          select: {
            id: true,
            title: true,
            boardId: true,
            board: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
