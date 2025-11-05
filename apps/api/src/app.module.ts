/**
 * Módulo Principal da Aplicação Nexa Oper API
 *
 * Este é o módulo raiz da aplicação NestJS que orquestra todos os
 * módulos, controladores, serviços e middlewares da API.
 *
 * ARQUITETURA MODULAR:
 * - DatabaseModule: Gerenciamento de conexão com banco de dados
 * - AprModule: Funcionalidades de Análise Preliminar de Risco
 * - AppController: Rotas básicas (health check, info)
 * - AppService: Lógica de negócio básica da aplicação
 *
 * MIDDLEWARES CONFIGURADOS:
 * - LoggerMiddleware: Logging estruturado de todas as requisições
 * - Aplicado globalmente para todas as rotas ('*')
 *
 * PADRÕES IMPLEMENTADOS:
 * - Injeção de dependência automática
 * - Separação de responsabilidades por módulos
 * - Middleware chain para cross-cutting concerns
 * - Configuração centralizada de módulos
 *
 * EXPANSIBILIDADE:
 * - Novos módulos podem ser facilmente adicionados no array imports
 * - Middlewares adicionais podem ser configurados no método configure()
 * - Providers globais podem ser adicionados no array providers
 *
 * @example
 * ```typescript
 * // Adicionando novo módulo
 * imports: [DatabaseModule, AprModule, ChecklistModule, UserModule]
 *
 * // Adicionando middleware específico
 * consumer.apply(AuthMiddleware).forRoutes('protected/*');
 * ```
 */

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/validation';
import { DatabaseModule } from '@database/database.module';
import { AprModule } from '@modules/apr/apr.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { ContractsModule } from '@modules/engine/contracts/contracts.module';
import { ChecklistModule } from '@modules/checklist/checklist.module';
import { VeiculoModule } from '@modules/veiculo/veiculo.module';
import { EletricistaModule } from '@modules/eletricista/eletricista.module';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { RateLimitMiddleware } from '@common/middleware/rate-limit.middleware';
import { ErrorLoggingInterceptor } from '@common/interceptors/error-logging.interceptor';
import { OperationLoggingInterceptor } from '@common/interceptors/operation-logging.interceptor';
import { EquipeModule } from './modules/equipe';
import { AtividadeModule } from './modules/atividade';
import { TurnoModule } from './modules/turno';
import { TipoVeiculoModule } from './modules/tipo-veiculo/tipo-veiculo.module';
import { TipoEquipeModule } from './modules/tipo-equipe/tipo-equipe.module';
import { MobileUploadModule } from './modules/mobile-upload/mobile-upload.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { TurnoRealizadoModule } from './modules/turno-realizado/turno-realizado.module';
import { JustificativasModule } from './modules/justificativas/justificativas.module';
import { WebLogsModule } from './modules/web-logs/web-logs.module';

/**
 * Módulo raiz da aplicação
 *
 * Configura e organiza todos os módulos da aplicação seguindo
 * os princípios de arquitetura modular do NestJS.
 *
 * RESPONSABILIDADES:
 * - Importar e configurar módulos de funcionalidades
 * - Registrar controladores e serviços globais
 * - Configurar middlewares da aplicação
 * - Definir providers compartilhados
 */
@Module({
  imports: [
    // Configuração de ambiente global com schema (via @nestjs/config)
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Módulo de agendamento de jobs
    ScheduleModule.forRoot(),

    // Módulo de banco de dados - deve ser importado primeiro
    DatabaseModule,

    // Módulos de funcionalidade
    //  de negócio
    AprModule,
    ChecklistModule,
    VeiculoModule,
    TipoVeiculoModule,
    TipoEquipeModule,
    EletricistaModule,
    EquipeModule,
    AtividadeModule,
    TurnoModule,

    // Módulos de autenticação e permissões
    AuthModule,
    ContractsModule,
    MobileUploadModule,
    HealthModule,
    MetricsModule,
    TurnoRealizadoModule,
    JustificativasModule,
    WebLogsModule,

    // TODO: Adicionar outros módulos conforme necessário
    // UserModule,
  ],
  controllers: [
    // Controlador principal com rotas básicas
    AppController,
  ],
  providers: [
    // Serviço principal da aplicação
    AppService,

    // Interceptors globais para logging e tratamento de erros
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLoggingInterceptor,
    },

    // TODO: Adicionar providers globais se necessário
    // GlobalConfigService,
    // CacheService,
  ],
})
export class AppModule implements NestModule {
  /**
   * Configuração de middlewares da aplicação
   *
   * Define quais middlewares serão aplicados e em quais rotas.
   * Middlewares são executados na ordem definida aqui.
   *
   * MIDDLEWARES CONFIGURADOS:
   * - LoggerMiddleware: Aplicado a todas as rotas para logging
   *
   * @param consumer - Consumer do NestJS para configurar middlewares
   *
   * @example
   * ```typescript
   * // Middleware para todas as rotas
   * consumer.apply(LoggerMiddleware).forRoutes('*');
   *
   * // Middleware para rotas específicas
   * consumer.apply(AuthMiddleware).forRoutes('protected/*');
   *
   * // Múltiplos middlewares em sequência
   * consumer
   *   .apply(CorsMiddleware, AuthMiddleware, LoggerMiddleware)
   *   .forRoutes('api/*');
   * ```
   */
  configure(consumer: MiddlewareConsumer): void {
    // Aplicar middleware de logging para todas as rotas
    consumer.apply(LoggerMiddleware).forRoutes('*');

    // Rate limiting específico para tentativas de login
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
  }
}
