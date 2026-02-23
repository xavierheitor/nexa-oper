// src/core/errors/app-error.ts
import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes';

/**
 * Classe base para erros da aplicação.
 *
 * Padroniza a estrutura de erro com código, status HTTP e mensagem.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: string[],
  ) {
    super(message);
  }

  /** Erro de validação (400) */
  static validation(message: string, details?: string[]) {
    return new AppError('VALIDATION', HttpStatus.BAD_REQUEST, message, details);
  }

  /** Erro de recurso não encontrado (404) */
  static notFound(message: string) {
    return new AppError('NOT_FOUND', HttpStatus.NOT_FOUND, message);
  }

  /** Erro de conflito (409) */
  static conflict(message: string) {
    return new AppError('CONFLICT', HttpStatus.CONFLICT, message);
  }

  /** Erro de acesso proibido (403) */
  static forbidden(message: string) {
    return new AppError('FORBIDDEN', HttpStatus.FORBIDDEN, message);
  }

  /** Erro de não autorizado (401) */
  static unauthorized(message: string) {
    return new AppError('UNAUTHORIZED', HttpStatus.UNAUTHORIZED, message);
  }

  /** Erro interno do servidor (500) */
  static internal(message = 'Erro interno do servidor') {
    return new AppError('INTERNAL', HttpStatus.INTERNAL_SERVER_ERROR, message);
  }
}
