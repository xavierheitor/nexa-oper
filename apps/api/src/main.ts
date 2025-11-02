/**
 * Ponto de Entrada da API NestJS - Nexa Oper
 *
 * Este arquivo configura e inicializa a aplicação NestJS com todas as
 * configurações necessárias para produção e desenvolvimento.
 *
 * CONFIGURAÇÕES IMPLEMENTADAS:
 * - CORS para comunicação com aplicação web
 * - Parsing de JSON/URL com limite de 50MB
 * - Timeout de requisições (5 minutos)
 * - Filtro global de exceções
 * - Prefixo global 'api' para todas as rotas
 * - Shutdown hooks para graceful shutdown
 * - Logging estruturado de inicialização
 *
 * ARQUITETURA:
 * - Segue padrões do NestJS com módulos organizados
 * - Middleware de logging para todas as requisições
 * - Tratamento global de exceções padronizado
 * - Configurações environment-aware (dev/prod)
 *
 * EXEMPLO DE ROTAS:
 * - Health Check: GET /api/health
 * - APR Modelos: GET /api/apr/modelos
 * - Database: GET /api/db/test
 *
 * VARIÁVEIS DE AMBIENTE:
 * - PORT: Porta da aplicação (padrão: 3001)
 * - NODE_ENV: Ambiente de execução (development/production)
 * - DATABASE_URL: String de conexão do banco de dados (obrigatório)
 * - JWT_SECRET: Chave secreta para assinatura de tokens JWT (obrigatório, mínimo 32 caracteres)
 * - CORS_ORIGINS: Origens permitidas para CORS, separadas por vírgula ou JSON array (opcional, padrão: todas as origens)
 * - RATE_LIMIT_WINDOW_MS: Janela do rate limiting em ms (opcional, padrão: 60000)
 * - RATE_LIMIT_MAX_PER_IP: Máximo por IP por janela (opcional, padrão: 20)
 * - RATE_LIMIT_MAX_PER_USER: Máximo por usuário por janela (opcional, padrão: 5)
 *
 * @example
 * ```bash
 * # Desenvolvimento
 * npm run start:dev
 *
 * # Produção
 * npm run build
 * npm run start:prod
 * ```
 */

// Carregar variáveis de ambiente do arquivo .env antes de qualquer outra coisa
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar .env do diretório raiz do projeto API
// Em desenvolvimento: __dirname é src/
// Em produção (compilado): __dirname é dist/
const envPath = resolve(
  __dirname.includes('dist')
    ? __dirname.replace('/dist', '')
    : __dirname.replace('/src', ''),
  '.env'
);
dotenv.config({ path: envPath });

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import { NextFunction, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { StandardLogger } from '@common/utils/logger';
import { getCorsOrigins } from '@common/utils/cors';
import { ensurePortFree } from '@common/utils/ports';

const execAsync = promisify(exec);

/**
 * Valida variáveis de ambiente críticas antes da inicialização
 *
 * Garante que todas as variáveis de ambiente obrigatórias estão
 * configuradas e têm valores válidos antes de iniciar a aplicação.
 *
 * @throws {Error} Se alguma variável obrigatória estiver ausente ou inválida
 */
// Validação de env agora é feita via @nestjs/config (Joi) no AppModule

// CORS e gerenciamento de portas extraídos para utils

/**
 * Função principal de inicialização da aplicação
 *
 * Configura todas as funcionalidades necessárias da API incluindo:
 * - Middlewares de parsing e timeout
 * - CORS para integração com frontend
 * - Validação global de DTOs
 * - Documentação Swagger
 * - Filtros de exceção globais
 * - Logging estruturado
 *
 * @throws {Error} Se falhar na inicialização da aplicação
 *
 * @example
 * ```typescript
 * // A função é chamada automaticamente na inicialização
 * // Não precisa ser chamada manualmente
 * ```
 */
async function bootstrap(): Promise<void> {
  const logger = new StandardLogger('Bootstrap');

  try {
    logger.log('🚀 Iniciando aplicação Nexa Oper API...');

    // Limpar porta apenas em desenvolvimento
    const port = parseInt(process.env.PORT ?? '3001', 10);
    if (process.env.NODE_ENV !== 'production') {
      await ensurePortFree(port, msg => logger.log(msg));
    } else {
      logger.log('ℹ️  Verificação de porta/kill desabilitada em produção');
    }

    // Criar aplicação NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
      abortOnError: false, // Evita crash em caso de erro durante inicialização
    });

    // Expor contexto global para resoluções excepcionais (ex.: decorators)
    (global as any).NEST_APP = app;

    // Segurança: headers seguros com Helmet
    app.use(
      helmet({
        contentSecurityPolicy: false, // desativado para não quebrar swagger
        crossOriginEmbedderPolicy: false,
      })
    );

    // Configurar parsing de requisições com limites mais seguros
    // JSON/URL: 2MB (uploads grandes ficam a cargo do Multer)
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    logger.log('✅ Parsing JSON/URL configurado: limite de 2MB');

    // Configurar CORS para integração com múltiplos aplicativos
    const corsOrigins = getCorsOrigins();

    // Configuração otimizada de CORS com segurança
    app.enableCors({
      origin: corsOrigins,
      credentials: true, // Permite envio de cookies e credenciais
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'Origin',
        'X-CSRF-Token',
      ],
      exposedHeaders: ['Authorization'], // Headers que o cliente pode ler
      maxAge: 86400, // Cache de preflight por 24 horas (reduz requisições OPTIONS)
      preflightContinue: false, // Não continuar se preflight falhar
      optionsSuccessStatus: 204, // Status 204 para OPTIONS bem-sucedidos
    });

    // Log informativo sobre configuração CORS
    if (typeof corsOrigins === 'function') {
      logger.warn(
        '⚠️  CORS configurado como PERMISSIVO (todas as origens permitidas)'
      );
      logger.warn(
        '   Isso permite acesso de qualquer origem - adequado para APIs públicas'
      );
      logger.warn(
        '   Para restringir, configure a variável CORS_ORIGINS com origens específicas'
      );
      if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
        logger.warn(
          '   💡 Configure CORS_ORIGINS separada por vírgulas: "https://app1.com,https://app2.com"'
        );
      }
    } else {
      if (Array.isArray(corsOrigins)) {
        const originsList = corsOrigins.join(', ');
        logger.log(
          `✅ CORS configurado para ${corsOrigins.length} origem(ens): ${originsList}`
        );
      } else {
        logger.log(`✅ CORS configurado para: todas as origens`);
      }
      logger.log(
        '   Headers permitidos otimizados, preflight cacheado por 24h'
      );
    }

    // Configurar timeout de requisições (1 minuto)
    app.use((req: Request, res: Response, next: NextFunction) => {
      const timeoutMs = 60_000; // 1 minuto
      req.setTimeout(timeoutMs);
      res.setTimeout(timeoutMs);
      next();
    });
    logger.log('✅ Timeout de requisições configurado para 1 minuto');

    // Configurar validação global de DTOs
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // Transforma automaticamente tipos
        whitelist: true, // Remove propriedades não definidas no DTO
        forbidNonWhitelisted: true, // Rejeita propriedades extras
        validateCustomDecorators: false, // Desabilitado para evitar conflitos com decorators customizados
      })
    );
    logger.log('✅ Validação global de DTOs configurada');

    // Configurar filtro global de exceções
    app.useGlobalFilters(new AllExceptionsFilter());
    logger.log('✅ Filtro global de exceções configurado');

    // Configurar documentação Swagger (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Nexa Oper API')
        .setDescription('API para gerenciamento de operações da Nexa')
        .setVersion('1.0')
        .addTag('apr', 'Análise Preliminar de Risco')
        .addTag('checklist', 'Checklists de Segurança')
        .addTag('database', 'Operações de Banco de Dados')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      logger.log('✅ Documentação Swagger disponível em /api/docs');
    }

    // Configurar prefixo global e shutdown hooks
    app.setGlobalPrefix('api');
    app.enableShutdownHooks();
    logger.log('✅ Prefixo global "api" configurado');

    // Configurar graceful shutdown com timeout
    const gracefulShutdown = async (signal: string) => {
      logger.log(`🔄 Recebido sinal ${signal}. Iniciando graceful shutdown...`);

      try {
        // Timeout de 30 segundos para graceful shutdown
        const shutdownTimeout = setTimeout(() => {
          logger.error('❌ Timeout no graceful shutdown. Forçando saída...');
          process.exit(1);
        }, 30000);

        await app.close();
        clearTimeout(shutdownTimeout);
        logger.log('✅ Aplicação finalizada com sucesso');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Erro durante graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Registrar handlers de shutdown
    process.on('SIGTERM', () => {
      void gracefulShutdown('SIGTERM');
    });
    process.on('SIGINT', () => {
      void gracefulShutdown('SIGINT');
    });
    process.on('SIGHUP', () => {
      void gracefulShutdown('SIGHUP');
    });

    // Inicializar servidor
    await app.listen(port);

    // Logging final de sucesso
    logger.log(`🎉 API Nexa Oper iniciada com sucesso!`);
    logger.log(`🌐 Servidor rodando na porta: ${port}`);
    logger.log(`📱 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
    logger.log(`🔗 URL base: http://localhost:${port}/api`);

    if (process.env.NODE_ENV !== 'production') {
      logger.log(`📚 Documentação: http://localhost:${port}/api/docs`);
    }
  } catch (error) {
    logger.error('❌ Falha crítica na inicialização da aplicação:', error);
    process.exit(1);
  }
}

// Inicializar aplicação com tratamento de erros robusto
bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('💥 Erro fatal durante inicialização:', error);
  logger.error('Stack trace completo:', error);
  process.exit(1);
});
