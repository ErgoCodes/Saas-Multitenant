import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { OrganizationsService } from './organizations/organizations.service';

describe('AppModule', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  });

  it('resolves the full dependency graph', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    expect(moduleRef.get(OrganizationsService)).toBeDefined();
    expect(moduleRef.get(WebsocketGateway)).toBeDefined();
    await moduleRef.close();
  });
});
