/**
 * Logger principal da aplicação: injete em qualquer service/controller.
 * Dentro de um request HTTP usa o logger do request (com requestId); fora usa o logger raiz.
 * API: info, warn, error, debug, operation, validation, database, auth.
 */
import { Injectable } from '@nestjs/common';
import type { Logger } from 'pino';
import { RequestContext } from './request-context';
import { createPinoLogger } from './pino';

/** Contexto opcional para operações (module, requestId, operation, userId, metadata). */
export type LogContext = Record<string, unknown>;

@Injectable()
export class AppLogger {
  private readonly fallback = createPinoLogger();

  /** Logger do request (se middleware rodou) ou logger raiz. */
  private get logger(): Logger {
    return RequestContext.getLogger() ?? this.fallback;
  }

  /** Log info (nível padrão). */
  info(message: string, data?: Record<string, unknown>) {
    this.logger.info({ data }, message);
  }

  /** Log warn (atenção). */
  warn(message: string, data?: Record<string, unknown>) {
    this.logger.warn({ data }, message);
  }

  /** Log error (erros e exceções). Suporta objeto Error. */
  error(message: string, err?: unknown, data?: Record<string, unknown>) {
    if (err instanceof Error) {
      this.logger.error(
        {
          err: { name: err.name, message: err.message, stack: err.stack },
          data,
        },
        message,
      );
      return;
    }
    this.logger.error({ err, data }, message);
  }

  /** Log debug (detalhes técnicos, dev). */
  debug(message: string, data?: Record<string, unknown>) {
    this.logger.debug({ data }, message);
  }

  /** Log de operação de negócio (tag OPERATION). */
  operation(message: string, ctx?: LogContext, data?: Record<string, unknown>) {
    this.logger.info({ tag: 'OPERATION', ctx, data }, message);
  }

  /** Log de validação (tag VALIDATION, nível debug). */
  validation(
    message: string,
    ctx?: LogContext,
    data?: Record<string, unknown>,
  ) {
    this.logger.debug({ tag: 'VALIDATION', ctx, data }, message);
  }

  /** Log de acesso a banco (tag DATABASE, nível debug). */
  database(message: string, ctx?: LogContext, data?: Record<string, unknown>) {
    this.logger.debug({ tag: 'DATABASE', ctx, data }, message);
  }

  /** Log de autenticação/autorização (tag AUTH, nível debug). */
  auth(message: string, ctx?: LogContext, data?: Record<string, unknown>) {
    this.logger.debug({ tag: 'AUTH', ctx, data }, message);
  }
}
