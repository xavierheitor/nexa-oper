/**
 * Decorator para Logging Automático de Operações
 *
 * Este decorator facilita o logging estruturado de operações em controladores
 * e serviços, fornecendo contexto automático e sanitização de dados.
 *
 * CARACTERÍSTICAS:
 * - Logging automático de entrada e saída
 * - Sanitização de dados sensíveis
 * - Contexto estruturado
 * - Medição de tempo de execução
 * - Tratamento de erros
 */

import { SetMetadata } from '@nestjs/common';

import { LogContext } from '../utils/logger';

export const LOG_OPERATION_KEY = 'log_operation';

/**
 * Interface para configuração do logging de operação
 */
export interface LogOperationOptions {
  /** Nome da operação para logging */
  operation: string;
  /** Se deve logar dados de entrada */
  logInput?: boolean;
  /** Se deve logar dados de saída */
  logOutput?: boolean;
  /** Se deve medir tempo de execução */
  measureTime?: boolean;
  /** Contexto adicional para logging */
  context?: Partial<LogContext>;
}

/**
 * Decorator para marcar métodos que devem ter logging automático
 *
 * @param options - Configurações do logging
 *
 * @example
 * ```typescript
 * @LogOperation({
 *   operation: 'createUser',
 *   logInput: true,
 *   logOutput: false,
 *   measureTime: true
 * })
 * async createUser(userData: CreateUserDto) {
 *   // implementação
 * }
 * ```
 */
export const LogOperation = (options: LogOperationOptions) =>
  SetMetadata(LOG_OPERATION_KEY, options);
