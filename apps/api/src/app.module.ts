import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from './core/logger/logger.module';
import { RequestContextMiddleware } from './core/logger';
import { ResponseEnvelopeInterceptor } from './core/http/interceptors';
import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth/auth.module';
import { LocalizacaoModule } from './modules/localizacao/localizacao.module';
import { SyncModule } from './modules/sync/sync.module';
import { TurnoModule } from './modules/turno/turno.module';
import { UploadModule } from './modules/upload/upload.module';
import { AtividadeUploadModule } from './modules/atividade-upload/atividade-upload.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: true }),
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CircuitBreakerModule,
    SyncModule,
    TurnoModule,
    UploadModule,
    LocalizacaoModule,
    AtividadeUploadModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('{*splat}');
  }
}
