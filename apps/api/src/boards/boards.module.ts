import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  providers: [BoardsService],
  controllers: [BoardsController],
})
export class BoardsModule {}
