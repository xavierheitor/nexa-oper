/**
 * Middleware de Logging para Requisições HTTP
 *
 * Registra requisições HTTP interceptando requests e responses.
 * Refatorado para ser otimizado para produção.
 */

import { randomUUID } from 'crypto';

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { MetricsService } from '../../metrics/metrics.service';
import { sanitizeData } from '../utils/logger';

// Extende Request para permitir anexar requestId
declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);
  constructor(private readonly metricsService?: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      // 1. RequestId: Reutilizar header ou gerar novo
      const requestId = (req.headers['x-request-id'] as string) || randomUUID();
      req.requestId = requestId;

      // Garante que o requestId vá também na resposta
      res.setHeader('x-request-id', requestId);

      const { method, originalUrl } = req;
      const startTime = Date.now();

      // Log inicial reduzido (apenas debug em prod, ou se for dev)
      // Em produção, queremos evitar ruído, logamos apenas o outcome no final
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`[${requestId}] 📥 ${method} ${originalUrl}`);
      }

      // Interceptar finalização da resposta
      res.on('finish', () => {
        try {
          const elapsed = Date.now() - startTime;
          const status = res.statusCode;
          const contentLength = res.get('content-length');

          // Nível de log depende do status
          // Erros 5xx e 4xx podem ser logados como error/warn, sucesso como log/debug
          // Em produção, logamos requests com sucesso apenas se forem lentos ou se configurado

          let logMsg = `[${requestId}] 📤 ${method} ${originalUrl} ${status} - ${elapsed}ms`;
          if (contentLength) logMsg += ` - ${contentLength}b`;

          // Se permitido logar body (dev ou via flag explicita)
          const shouldLogBody = process.env.LOG_HTTP_BODY === 'true';

          if (shouldLogBody) {
            // Cuidado: body da request ainda está acessível, mas body da response
            // exigiria interceptar res.send, o que é custoso. Logamos apenas req body se necessário.
            logMsg += `\nRequest Body: ${JSON.stringify(sanitizeData(req.body))}`;
          }

          if (status >= 500) {
            this.logger.error(logMsg);
          } else if (status >= 400) {
            this.logger.warn(logMsg);
          } else {
            // Sucesso
            this.logger.log(logMsg);
          }

          // Métricas
          if (this.metricsService) {
            const route = originalUrl.split('?')[0];
            this.metricsService.observeRequest(
              method,
              route,
              status,
              elapsed / 1000
            );
          }
        } catch (err) {
          this.logger.error(`Erro ao logar resposta para ${requestId}`, err);
        }
      });

      next();
    } catch (error) {
      this.logger.error('Falha crítica no LoggerMiddleware', error);
      next();
    }
  }
}
