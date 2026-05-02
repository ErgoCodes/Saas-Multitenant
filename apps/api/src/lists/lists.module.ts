import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { BoardAccessService } from '../common/board-access.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  controllers: [ListsController],
  providers: [ListsService, BoardAccessService],
  exports: [ListsService],
})
export class ListsModule {}
