/**
 * Middleware único de request: preenche RequestContext (AsyncLocalStorage) e opcionalmente req.
 * - RequestContext: requestId e logger disponíveis via RequestContext.getRequestId() / getLogger() (usado pelo AppLogger).
 * - req.requestId e req.log: preenchidos para quem preferir tipar com RequestWithLog.
 * Loga ao final da resposta (status, tempo, ip, user-agent).
 */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';
import { RequestContext } from './request-context';
import { createPinoLogger } from './pino';

/** Request do Express com requestId e log (child logger) anexados. Opcional; AppLogger usa RequestContext. */
export interface RequestWithLog extends Request {
  requestId: string;
  log: Logger;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly rootLogger: Logger = createPinoLogger();

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const requestId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      randomUUID();

    res.setHeader('x-request-id', requestId);

    const child = this.rootLogger.child({
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
    });

    /** Anexa ao req para quem usar RequestWithLog (opcional). */
    const reqWithLog = req as RequestWithLog;
    reqWithLog.requestId = requestId;
    reqWithLog.log = child;

    RequestContext.run({ requestId, logger: child }, () => {
      res.on('finish', () => {
        const end = process.hrtime.bigint();
        const ms = Number(end - start) / 1e6;
        const payload = {
          statusCode: res.statusCode,
          responseTimeMs: Number(ms.toFixed(2)),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        };
        if (res.statusCode >= 500) child.error(payload, 'HTTP 5xx');
        else if (res.statusCode >= 400) child.warn(payload, 'HTTP 4xx');
        else child.info(payload, 'HTTP request');
      });
      next();
    });
  }
}
