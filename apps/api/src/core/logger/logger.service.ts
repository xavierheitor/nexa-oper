/**
 * Logger NestJS que implementa LoggerService.
 * Use como logger global da aplicação (log, error, warn, debug, verbose).
 */
import { Injectable, LoggerService } from '@nestjs/common';
import { createPinoLogger } from './pino';
import type { LoggerLike } from './standard-logger';

/** Converte mensagem (any/unknown) em string para o Pino. */
function formatMessage(message: unknown): string {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (typeof message === 'object') return JSON.stringify(message);
  if (typeof message === 'symbol') return message.toString();
  // number | boolean | bigint | function (objeto já tratado acima)
  const primitive = message as string | number | boolean | bigint;
  return String(primitive);
}

@Injectable()
export class NestPinoLogger implements LoggerService {
  private readonly logger: LoggerLike = createPinoLogger();

  log(message: unknown, context?: string) {
    this.logger.info({ context }, formatMessage(message));
  }

  error(message: unknown, stack?: string, context?: string) {
    this.logger.error({ context, stack }, formatMessage(message));
  }

  warn(message: unknown, context?: string) {
    this.logger.warn({ context }, formatMessage(message));
  }

  debug(message: unknown, context?: string) {
    this.logger.debug({ context }, formatMessage(message));
  }

  verbose(message: unknown, context?: string) {
    // pino não tem verbose nativo; usa debug
    this.logger.debug({ context, verbose: true }, formatMessage(message));
  }

  /** Retorna o logger Pino bruto (ex.: para child ou middleware). */
  getRaw(): LoggerLike {
    return this.logger;
  }
}
