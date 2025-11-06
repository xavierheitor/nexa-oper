/**
 * Ponto de Entrada da API NestJS - Nexa Oper
 *
 * Bootstrap da aplicação, delegando configurações específicas
 * para módulos de configuração dedicados.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Express } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { StandardLogger } from '@common/utils/logger';
import { ensurePortFree } from '@common/utils/ports';

// Configurações
import {
  loadEnvironmentVariables,
  getAppConfig,
  configureTrustProxy,
  configureGlobalPrefix,
  configureValidationPipe,
  configureBodyParser,
  getSecurityConfig,
  configureSecurity,
  configureSwagger,
  configureCors,
  configureSpecialRoutes,
} from './config';

// Middlewares
import { requestLoggerMiddleware, timeoutMiddleware } from './middleware';

// Utils
import { setupGracefulShutdown } from './utils/graceful-shutdown';

/**
 * Carrega variáveis de ambiente antes de qualquer importação
 */
loadEnvironmentVariables();

/**
 * Função principal de bootstrap da aplicação
 */
async function bootstrap(): Promise<void> {
  const logger = new StandardLogger('Bootstrap');

  try {
    logger.log('🚀 Iniciando aplicação Nexa Oper API...');

    // Carregar configurações
    const appConfig = getAppConfig();
    const securityConfig = getSecurityConfig();

    // Em dev, garante a porta livre (mata processo preso)
    if (process.env.NODE_ENV !== 'production') {
      await ensurePortFree(appConfig.port, msg => logger.log(msg));
    } else {
      logger.log('ℹ️ Verificação de porta/kill desabilitada em produção');
    }

    // Cria app
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
      abortOnError: false,
    });
    (global as any).NEST_APP = app;

    const expressApp = app.getHttpAdapter().getInstance() as Express;

    // Configurações básicas
    configureTrustProxy(expressApp, appConfig.trustProxy, logger);
    configureSpecialRoutes(expressApp);

    // Middlewares
    expressApp.use(requestLoggerMiddleware);
    expressApp.use(timeoutMiddleware);

    // Segurança
    configureSecurity(app, securityConfig, logger);

    // Body parser
    configureBodyParser(
      expressApp,
      appConfig.jsonLimit,
      appConfig.urlencodedLimit,
      logger
    );

    // CORS
    configureCors(app, logger);

    // Timeout de requests (já configurado via middleware, apenas log)
    logger.log(
      `✅ Timeout de requisições configurado para ${appConfig.requestTimeout / 1000}s`
    );

    // Validação global
    configureValidationPipe(app, logger);

    // Filtro global de exceções
    app.useGlobalFilters(new AllExceptionsFilter());
    logger.log('✅ Filtro global de exceções configurado');

    // Swagger (apenas em desenvolvimento)
    configureSwagger(app, logger);

    // Prefixo global e shutdown hooks
    configureGlobalPrefix(app, appConfig.globalPrefix, logger);

    // Graceful shutdown
    setupGracefulShutdown(app, logger);

    // Sobe server
    await app.listen(appConfig.port, '0.0.0.0');

    // Logs finais
    logger.log('🎉 API Nexa Oper iniciada com sucesso!');
    logger.log(`🌐 Porta: ${appConfig.port}`);
    logger.log(`📱 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
    logger.log(
      `🔗 Base URL: http://localhost:${appConfig.port}/${appConfig.globalPrefix}`
    );
    if (process.env.NODE_ENV !== 'production') {
      logger.log(
        `📚 Docs: http://localhost:${appConfig.port}/${appConfig.globalPrefix}/docs`
      );
    }
  } catch (error) {
    logger.error('❌ Falha crítica na inicialização da aplicação:', error);
    process.exit(1);
  }
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('💥 Erro fatal durante inicialização:', error);
  logger.error('Stack trace completo:', error);
  process.exit(1);
});
