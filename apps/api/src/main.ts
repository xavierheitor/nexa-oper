/**
 * Ponto de Entrada da API NestJS - Nexa Oper
 * (versão com CORS unificado + HSTS condicional + trust proxy opcional)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar .env do diretório raiz do projeto API
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
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { StandardLogger } from '@common/utils/logger';
import { ensurePortFree } from '@common/utils/ports';

/** Util: interpreta CORS_ORIGINS como JSON array ou CSV; sem valor => permissivo */
function parseCors(): string[] | true {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return true; // permissivo (atenção em produção)
  try {
    const arr = raw.startsWith('[') ? JSON.parse(raw) : raw.split(',');
    const list = arr.map((s: string) => s.trim()).filter(Boolean);
    return list.length ? list : true;
  } catch {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
}

async function bootstrap(): Promise<void> {
  const logger = new StandardLogger('Bootstrap');

  try {
    logger.log('🚀 Iniciando aplicação Nexa Oper API...');

    // Porta
    const port = parseInt(process.env.PORT ?? '3001', 10);

    // Em dev, garante a porta livre (mata processo preso)
    if (process.env.NODE_ENV !== 'production') {
      await ensurePortFree(port, msg => logger.log(msg));
    } else {
      logger.log('ℹ️ Verificação de porta/kill desabilitada em produção');
    }

    // Cria app
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
      abortOnError: false,
    });
    (global as any).NEST_APP = app;

    const expressApp = app.getHttpAdapter().getInstance();

    // Opcional: confia no proxy quando houver balanceador/Nginx/ALB
    // Ative com TRUST_PROXY=true
    if (process.env.TRUST_PROXY === 'true') {
      expressApp.set('trust proxy', 1);
      logger.log('✅ trust proxy habilitado');
    }

    // Rota crua para health básico
    expressApp.get('/__ping', (_req: Request, res: Response) =>
      res.status(200).send('ok')
    );

    // Logger simples por request
    expressApp.use((req: Request, res: Response, next: NextFunction) => {
      const t0 = Date.now();
      console.log(`[REQ] ${req.method} ${req.url}`);
      res.on('finish', () => {
        console.log(
          `[RES] ${req.method} ${req.url} -> ${res.statusCode} (${Date.now() - t0}ms)`
        );
      });
      next();
    });

    // Segurança base
    const useHsts =
      process.env.NODE_ENV === 'production' && process.env.HAS_HTTPS === 'true';
    app.use(
      helmet({
        contentSecurityPolicy: false, // para não quebrar Swagger no dev
        crossOriginEmbedderPolicy: false,
        hsts: useHsts,
      })
    );
    if (useHsts) logger.log('✅ HSTS habilitado (produção + HTTPS verdadeiro)');

    // Parsing (envios grandes via Multer)
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    logger.log('✅ Parsing JSON/URL configurado: limite de 2MB');

    // CORS (fonte única)
    const allowed = parseCors();
    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, success: boolean) => void
      ) => {
        // Sem Origin (curl, prom, healthchecks) => libera
        if (!origin) return callback(null, true);
        if (allowed === true) return callback(null, true);

        // Match exato
        if (allowed.includes(origin)) return callback(null, true);

        // Tenta normalizar para protocolo+host
        try {
          const { protocol, host } = new URL(origin);
          const base = `${protocol}//${host}`;
          if (allowed.includes(base)) return callback(null, true);
        } catch {
          /* ignore */
        }

        return callback(new Error('CORS: Origin not allowed'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400,
    });

    if (allowed === true) {
      logger.warn(
        '⚠️ CORS PERMISSIVO (todas as origens). Use CORS_ORIGINS em produção.'
      );
    } else {
      logger.log(
        `✅ CORS restrito a ${allowed.length} origem(ens): ${allowed.join(', ')}`
      );
    }

    // Timeout de requests
    app.use((req: Request, res: Response, next: NextFunction) => {
      const timeoutMs = 60_000; // 1 minuto
      req.setTimeout(timeoutMs);
      res.setTimeout(timeoutMs);
      next();
    });
    logger.log('✅ Timeout de requisições configurado para 1 minuto');

    // Validação global
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        validateCustomDecorators: false,
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
      })
    );
    logger.log('✅ Validação global de DTOs configurada');

    // Filtro global de exceções
    app.useGlobalFilters(new AllExceptionsFilter());
    logger.log('✅ Filtro global de exceções configurado');

    // Swagger só fora de produção
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

    // Prefixo + shutdown
    app.setGlobalPrefix('api');
    app.enableShutdownHooks();
    logger.log('✅ Prefixo global "api" configurado');

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.log(`🔄 Recebido sinal ${signal}. Iniciando graceful shutdown...`);
      try {
        const shutdownTimeout = setTimeout(() => {
          logger.error('❌ Timeout no graceful shutdown. Forçando saída...');
          process.exit(1);
        }, 30_000);

        await app.close();
        clearTimeout(shutdownTimeout);
        logger.log('✅ Aplicação finalizada com sucesso');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Erro durante graceful shutdown:', error);
        process.exit(1);
      }
    };
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
    process.on('SIGHUP', () => void gracefulShutdown('SIGHUP'));

    // Sobe server
    await app.listen(port, '0.0.0.0');

    // Logs finais
    logger.log('🎉 API Nexa Oper iniciada com sucesso!');
    logger.log(`🌐 Porta: ${port}`);
    logger.log(`📱 Ambiente: ${process.env.NODE_ENV ?? 'development'}`);
    logger.log(`🔗 Base URL: http://localhost:${port}/api`);
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`📚 Docs: http://localhost:${port}/api/docs`);
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
