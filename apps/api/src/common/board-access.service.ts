import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardAccessService {
  constructor(private prisma: PrismaService) {}

  async assertOwnership(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== userId) throw new ForbiddenException('Access denied');
    return board;
  }

  async getBoardIdFromList(listId: string) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true },
    });
    if (!list) throw new NotFoundException('List not found');
    return list.boardId;
  }
}
