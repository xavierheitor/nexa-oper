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

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@database/database.module';
import { AprModule } from '@modules/apr/apr.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { ContractsModule } from '@modules/engine/contracts/contracts.module';
import { ChecklistModule } from '@modules/checklist/checklist.module';
import { VeiculoModule } from '@modules/veiculo/veiculo.module';
import { EletricistaModule } from '@modules/eletricista/eletricista.module';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { EquipeModule } from './modules/equipe';
import { AtividadeModule } from './modules/atividade';
import { TurnoModule } from './modules/turno';
import { EscalaModule } from './modules/escala';
import { TipoVeiculoModule } from './modules/tipo-veiculo/tipo-veiculo.module';
import { TipoEquipeModule } from './modules/tipo-equipe/tipo-equipe.module';

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
    EscalaModule,

    // Módulos de autenticação e permissões
    AuthModule,
    ContractsModule,

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

    // TODO: Adicionar outros middlewares conforme necessário
    // consumer
    //   .apply(AuthMiddleware)
    //   .forRoutes({ path: 'protected/*', method: RequestMethod.ALL });
  }
}
