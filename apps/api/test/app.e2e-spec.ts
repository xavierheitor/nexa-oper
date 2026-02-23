import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';

describe('App bootstrap (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prismaMock = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should bootstrap application module', () => {
    expect(app).toBeDefined();
  });
});
