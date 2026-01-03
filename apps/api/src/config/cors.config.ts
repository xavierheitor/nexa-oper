/**
 * Configuração de CORS
 *
 * Centraliza a configuração de CORS (Cross-Origin Resource Sharing)
 * da aplicação, utilizando a função getCorsOrigins() do módulo comum.
 */

import { getCorsOrigins } from '@common/utils/cors';
import { StandardLogger } from '@common/utils/logger';
import { INestApplication } from '@nestjs/common';

/**
 * Configura CORS na aplicação
 *
 * Utiliza a função getCorsOrigins() do módulo comum para determinar
 * as origens permitidas e configura o CORS com as opções apropriadas.
 */
export function configureCors(
  app: INestApplication,
  logger: StandardLogger
): void {
  const allowed = getCorsOrigins();
  const isAllowedArray = Array.isArray(allowed);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, success: boolean) => void
    ) => {
      // Sem Origin (curl, prom, healthchecks) => libera
      if (!origin) return callback(null, true);

      // Se for função, usa a função diretamente
      if (typeof allowed === 'function') {
        const result = allowed(origin);
        return callback(
          result ? null : new Error('CORS: Origin not allowed'),
          result
        );
      }

      // Se for array, verifica se está na lista
      if (isAllowedArray && allowed.includes(origin)) {
        return callback(null, true);
      }

      // Tenta normalizar para protocolo+host
      try {
        const { protocol, host } = new URL(origin);
        const base = `${protocol}//${host}`;
        if (isAllowedArray && allowed.includes(base)) {
          return callback(null, true);
        }
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

  if (!isAllowedArray) {
    logger.warn(
      '⚠️ CORS PERMISSIVO (todas as origens). Use #CORS_ORIGINS em produção.'
    );
  } else {
    logger.log(
      `✅ CORS restrito a ${allowed.length} origem(ens): ${allowed.join(', ')}`
    );
  }
}
