import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';
import { ResponseEnvelopeInterceptor } from './core/http/interceptors';
import { RequestContextMiddleware } from './core/logger';
import { LoggerModule } from './core/logger/logger.module';
import { DatabaseModule } from './database';
import { AtividadeUploadModule } from './modules/atividade-upload/atividade-upload.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { LocalizacaoModule } from './modules/localizacao/localizacao.module';
import { ProjetosModule } from './modules/projetos/projetos.module';
import { SyncModule } from './modules/sync/sync.module';
import { TurnoModule } from './modules/turno/turno.module';
import { UploadModule } from './modules/upload/upload.module';
import { MobileAppVersionModule } from './modules/mobile-app-version/mobile-app-version.module';

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
    ProjetosModule,
    MobileAppVersionModule,
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
