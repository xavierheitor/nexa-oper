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
import { NextFunction, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { StandardLogger } from '@common/utils/logger';

const execAsync = promisify(exec);

/**
 * Valida variáveis de ambiente críticas antes da inicialização
 *
 * Garante que todas as variáveis de ambiente obrigatórias estão
 * configuradas e têm valores válidos antes de iniciar a aplicação.
 *
 * @throws {Error} Se alguma variável obrigatória estiver ausente ou inválida
 */
function validateEnvironmentVariables(): void {
  const logger = new Logger('Bootstrap');

  // Lista de variáveis obrigatórias e suas validações
  const requiredEnvVars = [
    {
      name: 'JWT_SECRET',
      value: process.env.JWT_SECRET,
      validator: (val: string | undefined) => {
        if (!val || val.trim() === '') {
          return 'JWT_SECRET não pode estar vazio';
        }
        if (val === 'secret' || val.length < 32) {
          return 'JWT_SECRET deve ser uma string segura com pelo menos 32 caracteres e não pode ser "secret"';
        }
        return null;
      },
    },
    {
      name: 'DATABASE_URL',
      value: process.env.DATABASE_URL,
      validator: (val: string | undefined) => {
        if (!val || val.trim() === '') {
          return 'DATABASE_URL não pode estar vazio';
        }
        return null;
      },
    },
  ];

  const errors: string[] = [];

  for (const envVar of requiredEnvVars) {
    const error = envVar.validator(envVar.value);
    if (error) {
      errors.push(`${envVar.name}: ${error}`);
    }
  }

  if (errors.length > 0) {
    logger.error('❌ Erro de validação de variáveis de ambiente:');
    errors.forEach(error => logger.error(`  - ${error}`));
    logger.error(
      '💡 Configure as variáveis de ambiente necessárias antes de iniciar a aplicação.'
    );
    throw new Error(`Variáveis de ambiente inválidas: ${errors.join('; ')}`);
  }

  logger.log('✅ Variáveis de ambiente validadas com sucesso');
}

/**
 * Parseia e valida origens CORS da variável de ambiente
 *
 * Suporta múltiplos formatos:
 * - Variável de ambiente CORS_ORIGINS (separada por vírgula ou JSON array)
 * - Se não configurado, permite todas as origens (com warning)
 *
 * @returns Array de origens permitidas ou função que sempre retorna true
 *
 * @example
 * ```typescript
 * // CORS_ORIGINS="https://app1.com,https://app2.com"
 * // ou
 * // CORS_ORIGINS='["https://app1.com","https://app2.com"]'
 * ```
 */
function getCorsOrigins():
  | (string | boolean)[]
  | ((origin: string | undefined) => boolean) {
  const corsOriginsEnv = process.env.CORS_ORIGINS;

  // Se variável de ambiente não foi configurada
  if (!corsOriginsEnv || corsOriginsEnv.trim() === '') {
    // Em produção, permitir todas mas avisar
    if (process.env.NODE_ENV === 'production') {
      // Permitir todas as origens para flexibilidade com múltiplos apps
      return () => true;
    }
    // Em desenvolvimento, usar localhost padrão
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  try {
    // Tentar parsear como JSON array
    const parsed = JSON.parse(corsOriginsEnv);
    if (Array.isArray(parsed)) {
      return parsed.filter((origin: any) => typeof origin === 'string');
    }
  } catch {
    // Se não for JSON, tratar como string separada por vírgula
  }

  // Parsear como string separada por vírgula
  const origins = corsOriginsEnv
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  // Se não encontrou origens válidas, permitir todas
  return origins.length > 0 ? origins : () => true;
}

/**
 * Verifica se a porta está em uso
 * @param port - Porta a ser verificada
 * @returns True se a porta estiver em uso
 */
async function isPortInUse(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout.trim().length > 0;
  } catch {
    // Se não encontrar processos, a porta está livre
    return false;
  }
}

/**
 * Mata processos que estão usando a porta
 * @param port - Porta a ser liberada
 */
async function killPortProcesses(port: number, logger: StandardLogger): Promise<void> {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout
      .trim()
      .split('\n')
      .filter(pid => pid.length > 0);

    if (pids.length > 0) {
      logger.log(
        `🔄 Encontrados ${pids.length} processo(s) usando a porta ${port}`
      );

      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          logger.log(`✅ Processo ${pid} finalizado`);
        } catch (error) {
          logger.warn(`⚠️  Erro ao finalizar processo ${pid}:`, error.message);
        }
      }

      // Aguardar um pouco para garantir que a porta foi liberada
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch {
    logger.log(`ℹ️  Nenhum processo encontrado na porta ${port}`);
  }
}

/**
 * Limpa a porta antes da inicialização
 * @param port - Porta a ser limpa
 */
async function cleanupPort(port: number, logger: StandardLogger): Promise<void> {
  logger.log(`🔍 Verificando porta ${port}...`);

  if (await isPortInUse(port)) {
    logger.warn(`⚠️  Porta ${port} está em uso. Liberando...`);
    await killPortProcesses(port, logger);

    // Verificar novamente
    if (await isPortInUse(port)) {
      throw new Error(`Falha ao liberar porta ${port}`);
    } else {
      logger.log(`✅ Porta ${port} liberada com sucesso`);
    }
  } else {
    logger.log(`✅ Porta ${port} está livre`);
  }
}

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

    // Validar variáveis de ambiente críticas antes de qualquer inicialização
    validateEnvironmentVariables();

    // Limpar porta antes da inicialização
    const port = parseInt(process.env.PORT ?? '3001', 10);
    await cleanupPort(port, logger);

    // Criar aplicação NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
      abortOnError: false, // Evita crash em caso de erro durante inicialização
    });

    // Configurar parsing de requisições com limite generoso
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    logger.log('✅ Configurado parsing JSON/URL com limite de 50MB');

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

    // Configurar timeout de requisições (5 minutos)
    app.use((req: Request, res: Response, next: NextFunction) => {
      const timeoutMs = 300000; // 5 minutos
      req.setTimeout(timeoutMs);
      res.setTimeout(timeoutMs);
      next();
    });
    logger.log('✅ Timeout de requisições configurado para 5 minutos');

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

    // Configurar graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.log(`🔄 Recebido sinal ${signal}. Iniciando graceful shutdown...`);

      try {
        await app.close();
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
