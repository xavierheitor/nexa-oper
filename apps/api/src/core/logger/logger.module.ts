import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger';
import { NestPinoLogger } from './logger.service';
import { RequestContextMiddleware } from './request-context.middleware';

@Global()
@Module({
  providers: [AppLogger, NestPinoLogger, RequestContextMiddleware],
  exports: [AppLogger, NestPinoLogger],
})
export class LoggerModule {}
