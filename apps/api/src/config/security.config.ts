/**
 * Configurações de segurança da aplicação
 *
 * Centraliza configurações relacionadas a segurança como Helmet,
 * HSTS, e outras políticas de segurança.
 */

import { StandardLogger } from '@common/utils/logger';
import { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

/**
 * Interface para configuração de segurança
 */
export interface SecurityConfig {
  useHsts: boolean;
  contentSecurityPolicy: boolean;
  crossOriginEmbedderPolicy: boolean;
}

/**
 * Carrega configurações de segurança a partir de variáveis de ambiente
 */
export function getSecurityConfig(): SecurityConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasHttps = process.env.HAS_HTTPS === 'true';

  return {
    useHsts: isProduction && hasHttps,
    contentSecurityPolicy: false, // Desabilitado para não quebrar Swagger no dev
    crossOriginEmbedderPolicy: false,
  };
}

/**
 * Configura o Helmet com as políticas de segurança
 */
export function configureSecurity(
  app: INestApplication,
  config: SecurityConfig,
  logger: StandardLogger
): void {
  app.use(
    helmet({
      contentSecurityPolicy: config.contentSecurityPolicy,
      crossOriginEmbedderPolicy: config.crossOriginEmbedderPolicy,
      hsts: config.useHsts,
    })
  );

  if (config.useHsts) {
    logger.log('HSTS habilitado (produção + HTTPS verdadeiro)');
  }
}
