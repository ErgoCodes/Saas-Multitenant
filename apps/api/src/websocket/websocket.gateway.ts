import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsEvent } from '@task-manager/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // eslint-disable-next-line no-console
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // eslint-disable-next-line no-console
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(WsEvent.JOIN_BOARD)
  handleJoinBoard(client: Socket, boardId: string) {
    client.join(boardId);
  }

  @SubscribeMessage(WsEvent.LEAVE_BOARD)
  handleLeaveBoard(client: Socket, boardId: string) {
    client.leave(boardId);
  }

  emitToBoard(boardId: string, event: string, payload: any) {
    this.server.to(boardId).emit(event, payload);
  }
}
