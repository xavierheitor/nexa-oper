import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './core/config/configure-app';
import { env } from './core/config/env';
import { AppLogger, NestPinoLogger } from './core/logger';
import { GlobalExceptionFilter } from './core/errors/global-exception.filter';

async function bootstrap() {
  // Timezone padrão do processo (Date, Prisma, logs)
  process.env.TZ = env.TZ;

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // 1) Primeiro liga o logger do Nest
  app.useLogger(app.get(NestPinoLogger));

  // 2) Depois configura app (vai logar usando Pino)
  configureApp(app);

  // 3) Filtro global com DI
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(AppLogger)));

  await app.listen(env.PORT);

  const url = await app.getUrl();
  const logger = app.get(NestPinoLogger);
  logger.log(`Server listening on ${url}`, 'Bootstrap');
}
void bootstrap();
