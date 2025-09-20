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
 * - DATABASE_URL: String de conexão do banco de dados
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

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';

const execAsync = promisify(exec);

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
async function killPortProcesses(port: number): Promise<void> {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout
      .trim()
      .split('\n')
      .filter(pid => pid.length > 0);

    if (pids.length > 0) {
      console.log(
        `🔄 Encontrados ${pids.length} processo(s) usando a porta ${port}`
      );

      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          console.log(`✅ Processo ${pid} finalizado`);
        } catch (error) {
          console.log(`⚠️  Erro ao finalizar processo ${pid}:`, error.message);
        }
      }

      // Aguardar um pouco para garantir que a porta foi liberada
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch {
    console.log(`ℹ️  Nenhum processo encontrado na porta ${port}`);
  }
}

/**
 * Limpa a porta antes da inicialização
 * @param port - Porta a ser limpa
 */
async function cleanupPort(port: number): Promise<void> {
  console.log(`🔍 Verificando porta ${port}...`);

  if (await isPortInUse(port)) {
    console.log(`⚠️  Porta ${port} está em uso. Liberando...`);
    await killPortProcesses(port);

    // Verificar novamente
    if (await isPortInUse(port)) {
      throw new Error(`Falha ao liberar porta ${port}`);
    } else {
      console.log(`✅ Porta ${port} liberada com sucesso`);
    }
  } else {
    console.log(`✅ Porta ${port} está livre`);
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
  const logger = new Logger('Bootstrap');

  try {
    logger.log('🚀 Iniciando aplicação Nexa Oper API...');

    // Limpar porta antes da inicialização
    const port = parseInt(process.env.PORT ?? '3001', 10);
    await cleanupPort(port);

    // Criar aplicação NestJS
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
      abortOnError: false, // Evita crash em caso de erro durante inicialização
    });

    // Configurar parsing de requisições com limite generoso
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    logger.log('✅ Configurado parsing JSON/URL com limite de 50MB');

    // Configurar CORS para integração com aplicação web
    const corsOrigins =
      process.env.NODE_ENV === 'production'
        ? ['https://seu-dominio.com'] // TODO: Atualizar com domínio real
        : ['http://localhost:3000', 'http://127.0.0.1:3000'];

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    logger.log(`✅ CORS configurado para: ${corsOrigins.join(', ')}`);

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
  console.error('Stack trace completo:', error);
  process.exit(1);
});
