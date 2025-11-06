/**
 * Configurações da aplicação NestJS
 *
 * Centraliza todas as configurações relacionadas à inicialização
 * e comportamento da aplicação.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Express } from 'express';
import * as express from 'express';
import { StandardLogger } from '@common/utils/logger';

/**
 * Interface para configuração da aplicação
 */
export interface AppConfig {
  port: number;
  trustProxy: boolean;
  globalPrefix: string;
  requestTimeout: number;
  jsonLimit: string;
  urlencodedLimit: string;
}

/**
 * Carrega configurações da aplicação a partir de variáveis de ambiente
 */
export function getAppConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? '3001', 10),
    trustProxy: process.env.TRUST_PROXY === 'true',
    globalPrefix: 'api',
    requestTimeout: 60_000, // 1 minuto
    jsonLimit: '2mb',
    urlencodedLimit: '2mb',
  };
}

/**
 * Configura o proxy trust se necessário
 */
export function configureTrustProxy(
  expressApp: Express,
  trustProxy: boolean,
  logger: StandardLogger
): void {
  if (trustProxy) {
    expressApp.set('trust proxy', 1);
    logger.log('✅ trust proxy habilitado');
  }
}

/**
 * Configura o prefixo global da aplicação
 */
export function configureGlobalPrefix(
  app: INestApplication,
  prefix: string,
  logger: StandardLogger
): void {
  app.setGlobalPrefix(prefix);
  app.enableShutdownHooks();
  logger.log(`✅ Prefixo global "${prefix}" configurado`);
}

/**
 * Configura o ValidationPipe global
 */
export function configureValidationPipe(
  app: INestApplication,
  logger: StandardLogger
): void {
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
}

/**
 * Configura o body parser (JSON e URL encoded)
 */
export function configureBodyParser(
  expressApp: Express,
  jsonLimit: string,
  urlencodedLimit: string,
  logger: StandardLogger
): void {
  expressApp.use(express.json({ limit: jsonLimit }));
  expressApp.use(express.urlencoded({ extended: true, limit: urlencodedLimit }));

  logger.log(`✅ Parsing JSON/URL configurado: limite de ${jsonLimit}`);
}

