import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { BoardAccessService } from '../common/board-access.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  controllers: [TasksController],
  providers: [TasksService, BoardAccessService],
  exports: [TasksService],
})
export class TasksModule {}
