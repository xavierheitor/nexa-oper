import { SetMetadata } from '@nestjs/common';

export const LOG_OPERATION_KEY = 'logOperation';

export interface LogOperationOptions {
  logOutput?: boolean;
}

/**
 * Decorator para controlar o que é logado em operações.
 * Use logOutput: false para não logar resposta (ex.: tokens, dados sensíveis).
 */
export const LogOperation = (options: LogOperationOptions = {}) =>
  SetMetadata(LOG_OPERATION_KEY, { logOutput: options.logOutput ?? true });
