/**
 * Sistema de Logging Robusto e Tratamento de Erros
 *
 * Centraliza formatação, níveis de log e tratamento de erros para garantir
 * consistência, rastreabilidade e facilidade de debugging em toda a aplicação.
 *
 * CARACTERÍSTICAS:
 * - Logging estruturado com contexto
 * - Tratamento de erros padronizado
 * - Sanitização automática de dados sensíveis
 * - Diferentes níveis por ambiente
 * - Rastreamento de requisições
 * - Persistência em arquivos (app.log e error.log) em produção e desenvolvimento
 */

import * as fs from 'fs';
import * as path from 'path';

import { Logger, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Configuração de caminhos de log
 * Usa variável de ambiente LOG_PATH ou padrão ./logs
 */
const logPathFromEnv = process.env.LOG_PATH || './logs';
const LOG_DIR = path.resolve(logPathFromEnv);
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');

/**
 * Inicialização automática dos arquivos de log
 * Garante que o diretório e arquivos existem antes de usar
 */
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '', 'utf8');
}
if (!fs.existsSync(ERROR_LOG_FILE)) {
  fs.writeFileSync(ERROR_LOG_FILE, '', 'utf8');
}

/**
 * Função para escrever logs em arquivos
 *
 * Escreve o log formatado no arquivo apropriado baseado no nível
 * Garante que info e error sejam sempre escritos em produção
 *
 * LOGS ESCRITOS:
 * - info, log, warn: app.log apenas
 * - error: app.log e error.log (duplicado para facilitar análise)
 * - debug, verbose: apenas em desenvolvimento (se shouldLogDebug retornar true)
 *
 * @param line - Linha formatada para escrita
 * @param level - Nível do log para determinar arquivo de destino
 */
function writeLogToFile(line: string, level: string): void {
  try {
    const levelLower = level.toLowerCase();

    // Escreve sempre no arquivo principal (app.log) para info, log, warn e error
    // MAS APENAS SE NÃO FOR PRODUÇÃO (para evitar I/O bloqueante)
    if (
      process.env.NODE_ENV !== 'production' &&
      ['info', 'log', 'warn', 'error'].includes(levelLower)
    ) {
      fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
    }

    // Se for erro, escreve também no arquivo específico de erros
    if (levelLower === 'error') {
      fs.appendFileSync(ERROR_LOG_FILE, line + '\n', 'utf8');
    }

    // Debug e verbose apenas em desenvolvimento
    if (
      ['debug', 'verbose'].includes(levelLower) &&
      process.env.NODE_ENV !== 'production'
    ) {
      fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
    }
  } catch (err) {
    // Em caso de erro ao escrever, não quebra a aplicação
    // Apenas loga no console como fallback
    console.error('Erro ao escrever log em arquivo:', err);
  }
}

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
  DEVELOPMENT_LEVELS: [
    LogLevel.ERROR,
    LogLevel.WARN,
    LogLevel.LOG,
    LogLevel.DEBUG,
    LogLevel.VERBOSE,
  ],

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
 * Interface para contexto de logging
 */
export interface LogContext {
  userId?: string | number;
  requestId?: string;
  operation?: string;
  module?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface para erros estruturados
 */
export interface StructuredError {
  message: string;
  code?: string;
  statusCode?: number;
  context?: LogContext;
  stack?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Logger padronizado com formatação consistente e tratamento de erros
 *
 * ESTENDE a funcionalidade do Logger do NestJS para também escrever
 * logs em arquivos, garantindo persistência mesmo em produção.
 */
export class StandardLogger extends Logger {
  /**
   * Sobrescreve o método log para também escrever em arquivo
   */
  log(message: any, context?: string): void {
    super.log(message, context || this.context);
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    const logLine = `[${timestamp}] [LOG] [${ctx}] ${message}`;
    writeLogToFile(logLine, 'log');
  }

  /**
   * Sobrescreve o método error para também escrever em arquivo
   */
  error(message: any, stack?: string, context?: string): void {
    super.error(message, stack, context || this.context);
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    const stackTrace = stack ? `\n${stack}` : '';
    const logLine = `[${timestamp}] [ERROR] [${ctx}] ${message}${stackTrace}`;
    writeLogToFile(logLine, 'error');
  }

  /**
   * Sobrescreve o método warn para também escrever em arquivo
   */
  warn(message: any, context?: string): void {
    super.warn(message, context || this.context);
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    const logLine = `[${timestamp}] [WARN] [${ctx}] ${message}`;
    writeLogToFile(logLine, 'warn');
  }

  /**
   * Sobrescreve o método debug para também escrever em arquivo (se não for produção)
   */
  debug(message: any, context?: string): void {
    super.debug(message, context || this.context);
    if (shouldLogDebug()) {
      const timestamp = new Date().toISOString();
      const ctx = context || this.context || 'Application';
      const logLine = `[${timestamp}] [DEBUG] [${ctx}] ${message}`;
      writeLogToFile(logLine, 'debug');
    }
  }

  /**
   * Sobrescreve o método verbose para também escrever em arquivo (se não for produção)
   */
  verbose(message: any, context?: string): void {
    super.verbose(message, context || this.context);
    if (shouldLogDebug()) {
      const timestamp = new Date().toISOString();
      const ctx = context || this.context || 'Application';
      const logLine = `[${timestamp}] [VERBOSE] [${ctx}] ${message}`;
      writeLogToFile(logLine, 'verbose');
    }
  }

  /**
   * Método info para compatibilidade (equivalente a log)
   * Escreve em arquivo via método log sobrescrito
   */
  info(message: any, context?: string): void {
    this.log(message, context || this.context);
  }

  /**
   * Log de operação (CRUD, sync, etc.)
   */
  operation(message: string, context?: string): void {
    this.log(
      `${LOG_CONFIG.PREFIXES.OPERATION} ${message}`,
      context || this.context
    );
  }

  /**
   * Log de validação
   */
  validation(message: string, context?: string): void {
    if (shouldLogDebug()) {
      this.debug(
        `${LOG_CONFIG.PREFIXES.VALIDATION} ${message}`,
        context || this.context
      );
    }
  }

  /**
   * Log de banco de dados
   */
  database(message: string, context?: string): void {
    if (shouldLogDebug()) {
      this.debug(
        `${LOG_CONFIG.PREFIXES.DATABASE} ${message}`,
        context || this.context
      );
    }
  }

  /**
   * Log de autenticação
   */
  auth(message: string, context?: string): void {
    if (shouldLogDebug()) {
      this.debug(
        `${LOG_CONFIG.PREFIXES.AUTH} ${message}`,
        context || this.context
      );
    }
  }

  /**
   * Log de sincronização
   */
  sync(message: string, context?: string): void {
    this.log(`${LOG_CONFIG.PREFIXES.SYNC} ${message}`, context || this.context);
  }

  /**
   * Log de requisição HTTP
   */
  request(message: string, context?: string): void {
    if (shouldLogDebug()) {
      this.debug(`[REQUEST] ${message}`, context || this.context);
    }
  }

  /**
   * Log de resposta HTTP
   */
  response(message: string, context?: string): void {
    if (shouldLogDebug()) {
      this.debug(`[RES-HTTP] ${message}`, context || this.context);
    }
  }

  /**
   * Log de erro com contexto completo
   */
  errorWithContext(
    message: string,
    error: Error | unknown,
    context?: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const fullContext = context || this.context;

    this.error(
      `${LOG_CONFIG.PREFIXES.ERROR} ${message}: ${errorMessage}`,
      errorStack,
      fullContext
    );
  }

  /**
   * Log de erro HTTP (status 4xx)
   */
  httpError(
    status: number,
    message: string,
    path: string,
    context?: string
  ): void {
    this.warn(
      `[HTTP ${status}] ${message} - Path: ${path}`,
      context || this.context
    );
  }

  /**
   * Log de erro crítico de servidor (status 5xx)
   */
  serverError(
    message: string,
    error: Error | unknown,
    path: string,
    context?: string
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const fullContext = context || this.context;

    this.error(
      `[SERVER ERROR] ${message}: ${errorMessage} - Path: ${path}`,
      errorStack,
      fullContext
    );
  }

  /**
   * Log de início de operação
   */
  operationStart(
    operation: string,
    params?: Record<string, any>,
    context?: string
  ): void {
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
  contractPermission(
    contratoId: number,
    allowed: boolean,
    context?: string
  ): void {
    this.auth(
      `Contrato ${contratoId}: ${allowed ? 'permitido' : 'negado'}`,
      context
    );
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
export function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: string
): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
}

/**
 * Log de erro estruturado com contexto completo
 */
export function logErrorStructured(
  logger: StandardLogger,
  message: string,
  error: Error | HttpException,
  context?: LogContext
): void {
  const structuredError = createStructuredError(message, error, context);

  logger.error(
    `${LOG_CONFIG.PREFIXES.ERROR} ${message}`,
    JSON.stringify(structuredError, null, 2),
    context?.module
  );
}

/**
 * Log de operação com contexto estruturado
 */
export function logOperationWithContext(
  logger: StandardLogger,
  message: string,
  context: LogContext,
  data?: any
): void {
  const sanitizedData = data ? sanitizeData(data) : undefined;
  const logMessage = `${LOG_CONFIG.PREFIXES.OPERATION} ${message}`;

  if (sanitizedData) {
    logger.log(
      `${logMessage} - Context: ${JSON.stringify(context)} - Data: ${JSON.stringify(sanitizedData)}`
    );
  } else {
    logger.log(`${logMessage} - Context: ${JSON.stringify(context)}`);
  }
}

/**
 * Log de validação com dados sanitizados
 */
export function logValidationWithContext(
  logger: StandardLogger,
  message: string,
  context: LogContext,
  validationData?: any
): void {
  const sanitizedData = validationData
    ? sanitizeData(validationData)
    : undefined;
  const logMessage = `${LOG_CONFIG.PREFIXES.VALIDATION} ${message}`;

  if (sanitizedData) {
    logger.debug(
      `${logMessage} - Context: ${JSON.stringify(context)} - Validation: ${JSON.stringify(sanitizedData)}`
    );
  } else {
    logger.debug(`${logMessage} - Context: ${JSON.stringify(context)}`);
  }
}

/**
 * Log de banco de dados com query sanitizada
 */
export function logDatabaseWithContext(
  logger: StandardLogger,
  message: string,
  context: LogContext,
  queryData?: any
): void {
  const sanitizedData = queryData ? sanitizeData(queryData) : undefined;
  const logMessage = `${LOG_CONFIG.PREFIXES.DATABASE} ${message}`;

  if (sanitizedData) {
    logger.debug(
      `${logMessage} - Context: ${JSON.stringify(context)} - Query: ${JSON.stringify(sanitizedData)}`
    );
  } else {
    logger.debug(`${logMessage} - Context: ${JSON.stringify(context)}`);
  }
}

/**
 * Log de autenticação com dados sensíveis sanitizados
 */
export function logAuthWithContext(
  logger: StandardLogger,
  message: string,
  context: LogContext,
  authData?: any
): void {
  const sanitizedData = authData ? sanitizeData(authData) : undefined;
  const logMessage = `${LOG_CONFIG.PREFIXES.AUTH} ${message}`;

  if (sanitizedData) {
    logger.debug(
      `${logMessage} - Context: ${JSON.stringify(context)} - Auth: ${JSON.stringify(sanitizedData)}`
    );
  } else {
    logger.debug(`${logMessage} - Context: ${JSON.stringify(context)}`);
  }
}

/**
 * Cria erro estruturado para logging
 */
function createStructuredError(
  message: string,
  error: Error | HttpException,
  context?: LogContext
): StructuredError {
  const isHttpException = error instanceof HttpException;

  return {
    message,
    code: isHttpException ? error.name : error.constructor.name,
    statusCode: isHttpException
      ? error.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR,
    context,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    metadata: {
      errorName: error.name,
      errorMessage: error.message,
      ...(isHttpException && { response: error.getResponse() }),
    },
  };
}

/**
 * Lista de headers sensíveis que devem ser mascarados nos logs
 */
const SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'x-refresh-token',
] as const;

/**
 * Lista de campos sensíveis no body que devem ser mascarados nos logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'senha',
  'token',
  'accessToken',
  'refreshToken',
  'jwt',
  'secret',
  'apiKey',
  'apikey',
  'authorization',
  'auth',
  'credentials',
  'credential',
] as const;

/**
 * Sanitiza headers removendo ou mascarando informações sensíveis
 *
 * Substitui valores de headers sensíveis por '****' para evitar
 * exposição de tokens, cookies e outras credenciais nos logs.
 *
 * @param headers - Objeto com headers HTTP originais
 * @returns Objeto com headers sanitizados (valores sensíveis substituídos por '****')
 *
 * @example
 * ```typescript
 * sanitizeHeaders({ authorization: 'Bearer abc123', 'content-type': 'application/json' })
 * // Retorna: { authorization: '****', 'content-type': 'application/json' }
 * ```
 */
export function sanitizeHeaders(
  headers: Record<string, any>
): Record<string, any> {
  const sanitized = { ...headers };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_HEADERS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '****';
    }
  });

  return sanitized;
}

/**
 * Sanitiza dados (body, query, etc.) removendo ou mascarando campos sensíveis
 *
 * Substitui valores de campos sensíveis por '****' para evitar
 * exposição de senhas, tokens e outras credenciais nos logs.
 * Funciona recursivamente para objetos aninhados.
 *
 * @param data - Dados a serem sanitizados (objeto, array ou primitivo)
 * @returns Dados sanitizados (campos sensíveis substituídos por '****')
 *
 * @example
 * ```typescript
 * sanitizeData({ username: 'user', password: 'secret123', email: 'user@example.com' })
 * // Retorna: { username: 'user', password: '****', email: 'user@example.com' }
 * ```
 */
export function sanitizeData(data: any): any {
  // Caso primitivo, retorna como está
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  // Se for array, sanitiza cada elemento
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  // Se for objeto, sanitiza cada propriedade
  const sanitized: Record<string, any> = {};

  Object.keys(data).forEach(key => {
    const lowerKey = key.toLowerCase();

    // Verifica se o campo é sensível
    if (SENSITIVE_FIELDS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '****';
    } else {
      // Recursivamente sanitiza valores aninhados
      sanitized[key] = sanitizeData(data[key]);
    }
  });

  return sanitized;
}
