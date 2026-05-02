import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsEvent } from '@task-manager/types';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(typeof token === 'string' ? token : token[0]);
      (client as any).userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // eslint-disable-next-line no-console
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(WsEvent.JOIN_BOARD)
  async handleJoinBoard(client: Socket, boardId: string) {
    const userId = (client as any).userId;
    if (!userId) return;

    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (board && board.ownerId === userId) {
      client.join(boardId);
    }
  }

  @SubscribeMessage(WsEvent.LEAVE_BOARD)
  handleLeaveBoard(client: Socket, boardId: string) {
    client.leave(boardId);
  }

  emitToBoard(boardId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(boardId).emit(event, payload);
  }
}
