// src/core/config/configure-app.ts
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

import type { Express, RequestHandler } from 'express';
import * as express from 'express';
import * as path from 'node:path';
import helmet from 'helmet';

import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from '@nestjs/swagger';

import { env, isProd } from './env';
import { NestPinoLogger } from '../logger';

import { AppError } from '../errors/app-error';
import { Messages } from '../errors/messages';

/** Opções do Helmet (contentSecurityPolicy, crossOriginEmbedderPolicy, hsts, etc.). */
interface HelmetOptions {
  contentSecurityPolicy?: boolean;
  crossOriginEmbedderPolicy?: boolean;
  hsts?: boolean;
}

/** Retorna middleware Helmet. */
function createHelmetMiddleware(options: HelmetOptions): RequestHandler {
  return helmet(options);
}

/** Config aceito por SwaggerModule.createDocument (saída de DocumentBuilder.build()). */
type SwaggerDocumentConfig = Omit<OpenAPIObject, 'paths'>;

/** Monta documento Swagger e retorna OpenAPIObject. */
function createSwaggerDocument(
  app: INestApplication,
  config: SwaggerDocumentConfig,
): OpenAPIObject {
  return SwaggerModule.createDocument(app, config);
}

export function configureApp(app: INestApplication) {
  const logger = app.get(NestPinoLogger);

  // prefixo + shutdown hooks
  app.setGlobalPrefix(env.GLOBAL_PREFIX);
  app.enableShutdownHooks();

  // trust proxy (pra IP real atrás de Nginx)
  const expressApp = app.getHttpAdapter().getInstance() as Express;
  if (env.TRUST_PROXY) {
    expressApp.set('trust proxy', 1);
    logger.log('trust proxy habilitado');
  }

  // Limite dedicado para payload de atividade (fotos inline em base64)
  const normalizedPrefix = env.GLOBAL_PREFIX.replace(/^\/+|\/+$/g, '');
  const atividadeUploadRoute = normalizedPrefix
    ? `/${normalizedPrefix}/mobile/uploads/activities`
    : '/mobile/uploads/activities';
  expressApp.use(
    atividadeUploadRoute,
    express.json({ limit: env.ATIVIDADE_UPLOAD_JSON_LIMIT }),
  );

  // body limits globais (demais rotas)
  expressApp.use(express.json({ limit: env.JSON_LIMIT }));
  expressApp.use(
    express.urlencoded({ extended: true, limit: env.URLENCODED_LIMIT }),
  );

  // validation (DTO) -> padroniza pro seu AppError
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,

      exceptionFactory: (errors: ValidationError[]) => {
        type ItemWithConstraints = { constraints?: Record<string, string> };
        const items = errors as ItemWithConstraints[];
        const details: string[] = items.flatMap((err) =>
          err.constraints ? Object.values(err.constraints) : [],
        );
        throw AppError.validation(
          Messages.invalidPayload,
          details.length > 0 ? details : undefined,
        );
      },
    }),
  );

  // CORS
  configureCors(app, logger);

  // Security (helmet)
  configureSecurity(app, logger);

  // Rotas especiais (ping)
  expressApp.get('/__ping', (_req, res) => res.status(200).send('ok'));

  // Arquivos de upload (fora do prefixo /api)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  expressApp.use(
    '/uploads',
    express.static(uploadsDir, {
      dotfiles: 'deny',
      index: false,
      fallthrough: false,
      redirect: false,
    }),
  );

  // Swagger (dev/staging)
  if (env.SWAGGER_ENABLED && !isProd) {
    configureSwagger(app, logger);
  }

  logger.log(
    `App configurada. Prefixo=/${env.GLOBAL_PREFIX} env=${env.NODE_ENV}`,
  );
}

type CorsCallback = (err: Error | null, allow?: boolean) => void;

function configureCors(app: INestApplication, logger: NestPinoLogger) {
  const allowed = env.CORS_ORIGINS;

  // Em produção, se não configurar, bloqueia (seguro por padrão)
  if (isProd && (!allowed || allowed.length === 0)) {
    logger.warn('CORS bloqueado em produção (CORS_ORIGINS vazio).');
    app.enableCors({
      origin: (_origin: string | undefined, cb: CorsCallback) =>
        cb(new Error('CORS: Origin not allowed'), false),
      credentials: true,
    });
    return;
  }

  // Dev: se vazio, permissivo (esperado em desenvolvimento)
  if (!allowed || allowed.length === 0) {
    logger.log('CORS permissivo (dev). Configure CORS_ORIGINS em produção.');
    app.enableCors({ origin: true, credentials: true });
    return;
  }

  // Lista definida: valida por match exato e por base protocol+host
  app.enableCors({
    origin: (origin: string | undefined, cb: CorsCallback) => {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);

      try {
        const parsed = new URL(origin);
        const base = `${parsed.protocol}//${parsed.host}`;
        if (allowed.includes(base)) return cb(null, true);
      } catch {
        // URL inválido, rejeitar
      }

      return cb(new Error('CORS: Origin not allowed'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  });

  logger.log(`CORS restrito: ${allowed.join(', ')}`);
}

function configureSecurity(app: INestApplication, logger: NestPinoLogger) {
  const useHsts = isProd && env.HAS_HTTPS;

  const securityMiddleware = createHelmetMiddleware({
    contentSecurityPolicy: env.SECURITY_CSP,
    crossOriginEmbedderPolicy: env.SECURITY_COEP,
    hsts: useHsts,
  });
  app.use(securityMiddleware);

  if (useHsts) logger.log('HSTS habilitado (produção + HTTPS)');
}

function configureSwagger(app: INestApplication, logger: NestPinoLogger) {
  const config = new DocumentBuilder()
    .setTitle('Nexa Oper API')
    .setDescription('API para gerenciamento de operações')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const doc = createSwaggerDocument(app, config);
  SwaggerModule.setup(`${env.GLOBAL_PREFIX}/docs`, app, doc);

  logger.log(`Swagger em /${env.GLOBAL_PREFIX}/docs`);
}
