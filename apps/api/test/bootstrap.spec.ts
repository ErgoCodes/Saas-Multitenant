import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Module } from '@nestjs/common';
import * as request from 'supertest';

@Controller('test')
class TestController {
  @Get()
  ok() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [TestController],
})
class TestModule {}

describe('Bootstrap middleware', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use((req, res, next) => {
      if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network'] === 'true') {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
      }
      next();
    });

    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Private Network Access header', () => {
    it('includes PNA header on OPTIONS preflight with access-control-request-private-network: true', async () => {
      const res = await request(app.getHttpServer())
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Private-Network', 'true');

      expect(res.headers['access-control-allow-private-network']).toBe('true');
    });

    it('does NOT include PNA header on OPTIONS without access-control-request-private-network', async () => {
      const res = await request(app.getHttpServer())
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-private-network']).toBeUndefined();
    });

    it('does NOT include PNA header on regular GET requests', async () => {
      const res = await request(app.getHttpServer())
        .get('/test')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-private-network']).toBeUndefined();
    });

    it('does NOT include PNA header on POST requests even with PNA header in request', async () => {
      const res = await request(app.getHttpServer())
        .post('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Private-Network', 'true');

      expect(res.headers['access-control-allow-private-network']).toBeUndefined();
    });
  });

  describe('CORS headers', () => {
    it('responds to preflight from localhost:3000 with correct CORS headers', async () => {
      const res = await request(app.getHttpServer())
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('combined PNA + CORS preflight', () => {
    it('includes both CORS and PNA headers on a valid preflight', async () => {
      const res = await request(app.getHttpServer())
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Private-Network', 'true');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-private-network']).toBe('true');
    });

    it('returns PNA header even when Origin is from a private network IP', async () => {
      const res = await request(app.getHttpServer())
        .options('/test')
        .set('Origin', 'http://192.168.1.100:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Private-Network', 'true');

      expect(res.headers['access-control-allow-private-network']).toBe('true');
    });
  });
});
