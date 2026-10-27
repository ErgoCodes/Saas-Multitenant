import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { BoardAccessService } from '../common/board-access.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, WebsocketModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, BoardAccessService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
