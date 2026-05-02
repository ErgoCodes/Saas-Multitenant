import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { BoardAccessService } from '../common/board-access.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardAccessService],
  exports: [BoardsService, BoardAccessService],
})
export class BoardsModule {}
