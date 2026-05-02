import { Module } from '@nestjs/common';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  providers: [ListsService],
  controllers: [ListsController],
})
export class ListsModule {}
