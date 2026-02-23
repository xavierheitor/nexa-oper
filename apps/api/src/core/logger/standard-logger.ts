/**
 * Logger de alto nível com métodos semânticos (operation, validation, database, auth).
 * Recebe um LoggerLike (ex.: Pino) e expõe API tipada com contexto opcional.
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/** Contexto opcional para operações (userId, requestId, operation, module, metadata). */
export interface LogContext {
  userId?: string | number;
  requestId?: string;
  operation?: string;
  module?: string;
  metadata?: Record<string, unknown>;
}

/** Contrato mínimo do logger (compatível com pino). Usado para tipar e testar. */
export interface LoggerLike {
  child(bindings: Record<string, unknown>): LoggerLike;
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
  debug(obj: object, msg?: string): void;
}

export class StandardLogger {
  constructor(
    private readonly logger: LoggerLike,
    private readonly context?: string,
  ) {}

  /** Cria um child logger com bindings fixos (ex.: requestId, userId). */
  child(bindings: Record<string, unknown>) {
    return new StandardLogger(this.logger.child(bindings), this.context);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.logger.info({ context: this.context, data }, message);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.logger.warn({ context: this.context, data }, message);
  }

  error(message: string, err?: unknown, data?: Record<string, unknown>) {
    const e =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { err };
    this.logger.error({ context: this.context, ...e, data }, message);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.logger.debug({ context: this.context, data }, message);
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
