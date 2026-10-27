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
import { BoardAccessService } from '../common/board-access.service';

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
    private boardAccess: BoardAccessService,
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

    try {
      await this.boardAccess.assertBoardAccess(userId, boardId);
    } catch {
      return;
    }
    client.join(boardId);
  }

  @SubscribeMessage(WsEvent.LEAVE_BOARD)
  handleLeaveBoard(client: Socket, boardId: string) {
    client.leave(boardId);
  }

  evictUserFromRooms(userId: string, roomIds: string[]) {
    if (!this.server?.sockets?.sockets || roomIds.length === 0) return;
    for (const socket of this.server.sockets.sockets.values()) {
      if ((socket as any).userId === userId) {
        for (const roomId of roomIds) {
          socket.leave(roomId);
        }
      }
    }
  }

  emitToBoard(boardId: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(boardId).emit(event, payload);
  }
}
