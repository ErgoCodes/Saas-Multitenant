import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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

  private async assertValidAssignee(assigneeId: string, organizationId: string) {
    const membership = await this.boardAccess.findMembership(assigneeId, organizationId);
    if (!membership) {
      throw new BadRequestException(
        `Assignee "${assigneeId}" is not a member of this organization`,
      );
    }
  }

  async create(userId: string, dto: CreateTaskDto) {
    const boardId = await this.boardAccess.getBoardIdFromList(dto.listId);
    const board = await this.boardAccess.assertBoardAccess(userId, boardId);

    if (dto.assigneeId && board?.organizationId) {
      await this.assertValidAssignee(dto.assigneeId, board.organizationId);
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { listId: dto.listId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = lastTask ? lastTask.order + 1 : 0;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        order: nextOrder,
        listId: dto.listId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    this.wsGateway.emitToBoard(boardId, WsEvent.TASK_CREATED, task);
    return task;
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        list: { select: { boardId: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.boardAccess.assertBoardAccess(userId, task.list.boardId);
    return task;
  }

  async findByList(userId: string, listId: string) {
    const boardId = await this.boardAccess.getBoardIdFromList(listId);
    await this.boardAccess.assertBoardAccess(userId, boardId);
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { list: { select: { boardId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    const board = await this.boardAccess.assertBoardAccess(userId, task.list.boardId);

    if (dto.assigneeId && board?.organizationId) {
      await this.assertValidAssignee(dto.assigneeId, board.organizationId);
    }

    if (dto.listId) {
      const targetBoardId = await this.boardAccess.getBoardIdFromList(dto.listId);
      if (targetBoardId !== task.list.boardId) {
        throw new ForbiddenException('Cannot move task to a different board');
      }
    }

    const originalListId = task.listId;
    const targetListId = dto.listId ?? originalListId;
    const { dueDate, order, ...restDto } = dto;

    const parsedDueDate =
      dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      let finalOrder = order;

      if (order !== undefined || targetListId !== originalListId) {
        const targetSiblings = await tx.task.findMany({
          where: { listId: targetListId, id: { not: id } },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, order: true },
        });

        const requestedIndex =
          order !== undefined ? Math.max(0, order) : targetSiblings.length;
        finalOrder = Math.min(requestedIndex, targetSiblings.length);

        for (let idx = 0; idx < targetSiblings.length; idx++) {
          const sibling = targetSiblings[idx];
          const newSiblingOrder = idx >= finalOrder ? idx + 1 : idx;
          if (sibling.order !== newSiblingOrder) {
            await tx.task.update({
              where: { id: sibling.id },
              data: { order: newSiblingOrder },
            });
          }
        }

        if (targetListId !== originalListId) {
          const sourceSiblings = await tx.task.findMany({
            where: { listId: originalListId, id: { not: id } },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            select: { id: true, order: true },
          });
          for (let idx = 0; idx < sourceSiblings.length; idx++) {
            const sibling = sourceSiblings[idx];
            if (sibling.order !== idx) {
              await tx.task.update({
                where: { id: sibling.id },
                data: { order: idx },
              });
            }
          }
        }
      }

      return tx.task.update({
        where: { id },
        data: {
          ...restDto,
          ...(finalOrder !== undefined ? { order: finalOrder } : {}),
          ...(parsedDueDate !== undefined ? { dueDate: parsedDueDate } : {}),
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
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
    await this.boardAccess.assertBoardAccess(userId, task.list.boardId);
    await this.prisma.task.delete({ where: { id } });
    this.wsGateway.emitToBoard(task.list.boardId, WsEvent.TASK_DELETED, { id });
    return { id };
  }

  async findByDateRange(userId: string, query: CalendarQueryDto) {
    const start = new Date(query.startDate);
    const end = new Date(query.endDate);

    if (query.organizationId) {
      await this.boardAccess.assertOrgAccess(userId, query.organizationId);
    }

    const boardWhere: Record<string, unknown> = {
      organization: {
        members: {
          some: { userId },
        },
      },
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.boardId ? { id: query.boardId } : {}),
    };

    const where: Record<string, unknown> = {
      list: {
        board: boardWhere,
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

    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        list: {
          select: {
            id: true,
            title: true,
            boardId: true,
            board: { select: { id: true, title: true, organizationId: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
