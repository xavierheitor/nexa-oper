/**
 * Utilitários de Logging Padronizados
 *
 * Centraliza formatação e níveis de log para garantir
 * consistência entre diferentes módulos da aplicação.
 */

import { Logger } from '@nestjs/common';

/**
 * Níveis de log padronizados
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  LOG = 'log',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Configurações de logging
 */
export const LOG_CONFIG = {
  // Reduzir verbosidade em produção
  PRODUCTION_LEVELS: [LogLevel.ERROR, LogLevel.WARN, LogLevel.LOG],
  DEVELOPMENT_LEVELS: [LogLevel.ERROR, LogLevel.WARN, LogLevel.LOG, LogLevel.DEBUG, LogLevel.VERBOSE],

  // Prefixos padronizados
  PREFIXES: {
    OPERATION: '[OPERATION]',
    VALIDATION: '[VALIDATION]',
    DATABASE: '[DATABASE]',
    AUTH: '[AUTH]',
    SYNC: '[SYNC]',
    ERROR: '[ERROR]',
  },
} as const;

/**
 * Logger padronizado com formatação consistente
 */
export class StandardLogger extends Logger {
  /**
   * Log de operação (CRUD, sync, etc.)
   */
  operation(message: string, context?: string): void {
    this.log(`${LOG_CONFIG.PREFIXES.OPERATION} ${message}`, context);
  }

  /**
   * Log de validação
   */
  validation(message: string, context?: string): void {
    this.debug(`${LOG_CONFIG.PREFIXES.VALIDATION} ${message}`, context);
  }

  /**
   * Log de banco de dados
   */
  database(message: string, context?: string): void {
    this.debug(`${LOG_CONFIG.PREFIXES.DATABASE} ${message}`, context);
  }

  /**
   * Log de autenticação
   */
  auth(message: string, context?: string): void {
    this.debug(`${LOG_CONFIG.PREFIXES.AUTH} ${message}`, context);
  }

  /**
   * Log de sincronização
   */
  sync(message: string, context?: string): void {
    this.log(`${LOG_CONFIG.PREFIXES.SYNC} ${message}`, context);
  }

  /**
   * Log de erro com contexto
   */
  errorWithContext(message: string, error: Error, context?: string): void {
    this.error(`${LOG_CONFIG.PREFIXES.ERROR} ${message}`, error.stack, context);
  }

  /**
   * Log de início de operação
   */
  operationStart(operation: string, params?: Record<string, any>, context?: string): void {
    const paramsStr = params ? ` - Parâmetros: ${JSON.stringify(params)}` : '';
    this.operation(`Iniciando ${operation}${paramsStr}`, context);
  }

  /**
   * Log de fim de operação
   */
  operationEnd(operation: string, result?: any, context?: string): void {
    const resultStr = result ? ` - Resultado: ${JSON.stringify(result)}` : '';
    this.operation(`Concluído ${operation}${resultStr}`, context);
  }

  /**
   * Log de contagem de registros
   */
  count(entity: string, count: number, context?: string): void {
    this.operation(`Total de ${entity}: ${count}`, context);
  }

  /**
   * Log de validação de parâmetros
   */
  validateParam(param: string, value: any, context?: string): void {
    this.validation(`Validando ${param}: ${JSON.stringify(value)}`, context);
  }

  /**
   * Log de permissão de contrato
   */
  contractPermission(contratoId: number, allowed: boolean, context?: string): void {
    this.auth(`Contrato ${contratoId}: ${allowed ? 'permitido' : 'negado'}`, context);
  }
}

/**
 * Factory para criar logger padronizado
 */
export function createStandardLogger(context: string): StandardLogger {
  return new StandardLogger(context);
}

/**
 * Verifica se deve logar em debug baseado no ambiente
 */
export function shouldLogDebug(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Formata mensagem de log com timestamp
 */
export function formatLogMessage(level: LogLevel, message: string, context?: string): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
}
