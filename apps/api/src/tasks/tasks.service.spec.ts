import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Priority, TaskStatus, WsEvent } from '@task-manager/types';
import { TasksService } from './tasks.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';

describe('TasksService & UpdateTaskDto', () => {
  describe('UpdateTaskDto validation', () => {
    it('accepts YYYY-MM-DD dueDate string', async () => {
      const dto = plainToInstance(UpdateTaskDto, { dueDate: '2026-10-26' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts null dueDate to unschedule a task', async () => {
      const dto = plainToInstance(UpdateTaskDto, { dueDate: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects an empty-string assigneeId', async () => {
      const dto = plainToInstance(UpdateTaskDto, { assigneeId: '' });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['assigneeId']);
    });

    it('accepts null assigneeId to unassign a task', async () => {
      const dto = plainToInstance(UpdateTaskDto, { assigneeId: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateTaskDto validation', () => {
    it('rejects an empty-string assigneeId', async () => {
      const dto = plainToInstance(CreateTaskDto, {
        title: 'Task',
        listId: 'list-1',
        assigneeId: '',
      });
      const errors = await validate(dto);
      expect(errors.map((e) => e.property)).toEqual(['assigneeId']);
    });
  });

  describe('TasksService', () => {
    const mockPrisma: any = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      organizationMember: {
        findUnique: jest.fn(),
      },
      task: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const mockWsGateway = {
      emitToBoard: jest.fn(),
    };
    const mockBoardAccess = {
      getBoardIdFromList: jest.fn(),
      assertBoardAccess: jest.fn(),
      assertOrgAccess: jest.fn(),
      findMembership: jest.fn(),
    };

    let service: TasksService;

    beforeEach(() => {
      jest.clearAllMocks();
      service = new TasksService(
        mockPrisma as any,
        mockWsGateway as any,
        mockBoardAccess as any,
      );
    });

    it('calculates next order and parses dueDate on create', async () => {
      mockBoardAccess.getBoardIdFromList.mockResolvedValue('board-1');
      mockBoardAccess.assertBoardAccess.mockResolvedValue({ id: 'board-1', organizationId: 'org-1' });
      mockPrisma.task.findFirst.mockResolvedValue({ order: 2 });
      mockPrisma.task.create.mockImplementation(({ data }) => Promise.resolve({ id: 't-1', ...data }));

      const result = await service.create('user-1', {
        title: 'Write tests',
        priority: Priority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        listId: 'list-1',
        dueDate: '2026-10-28',
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Write tests',
          description: undefined,
          priority: Priority.HIGH,
          status: TaskStatus.IN_PROGRESS,
          order: 3,
          listId: 'list-1',
          dueDate: new Date('2026-10-28'),
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(mockWsGateway.emitToBoard).toHaveBeenCalledWith('board-1', WsEvent.TASK_CREATED, result);
    });

    it('throws BadRequestException naming the assignee when assignee is not in the organization', async () => {
      mockBoardAccess.getBoardIdFromList.mockResolvedValue('board-1');
      mockBoardAccess.assertBoardAccess.mockResolvedValue({ id: 'board-1', organizationId: 'org-1' });
      mockBoardAccess.findMembership.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          title: 'Task with bad assignee',
          listId: 'list-1',
          assigneeId: 'outsider-99',
        }),
      ).rejects.toThrow(
        new BadRequestException('Assignee "outsider-99" is not a member of this organization'),
      );
      expect(mockBoardAccess.findMembership).toHaveBeenCalledWith('outsider-99', 'org-1');
    });

    it('converts YYYY-MM-DD dueDate string to Date instance on update inside a transaction', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 't-1',
        listId: 'list-1',
        list: { boardId: 'board-1' },
      });
      mockBoardAccess.assertBoardAccess.mockResolvedValue({ id: 'board-1', organizationId: 'org-1' });
      mockPrisma.task.update.mockImplementation(({ data }) => Promise.resolve({ id: 't-1', ...data }));

      await service.update('user-1', 't-1', { dueDate: '2026-10-26' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          dueDate: new Date('2026-10-26'),
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    });

    it('clamps negative order (-1) to 0 when dropping into an empty list', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 't-1',
        listId: 'list-1',
        list: { boardId: 'board-1' },
      });
      mockBoardAccess.assertBoardAccess.mockResolvedValue({ id: 'board-1', organizationId: 'org-1' });
      mockBoardAccess.getBoardIdFromList.mockResolvedValue('board-1');
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.task.update.mockImplementation(({ data }) => Promise.resolve({ id: 't-1', ...data }));

      await service.update('user-1', 't-1', { listId: 'list-2', order: -1 });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: {
          listId: 'list-2',
          order: 0,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
      expect(mockWsGateway.emitToBoard).toHaveBeenCalledWith(
        'board-1',
        WsEvent.TASK_MOVED,
        expect.objectContaining({ id: 't-1', listId: 'list-2', order: 0 }),
      );
    });
  });
});
