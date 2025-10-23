/**
 * Utilitários para padronização de mensagens de erro da API
 *
 * Este módulo resolve problemas de inconsistência entre mensagens
 * de erro do class-validator e o formato esperado pelo app mobile.
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Interface para resposta de erro padronizada
 */
export interface StandardErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  details?: string[];
  error?: string;
}

/**
 * Converte mensagens de erro do class-validator para formato padronizado
 *
 * @param validationErrors - Array de mensagens de erro do class-validator
 * @param defaultMessage - Mensagem padrão se não houver erros específicos
 * @returns Objeto com mensagem principal e detalhes
 */
export function formatValidationErrors(
  validationErrors: string[],
  defaultMessage: string = 'Dados inválidos fornecidos'
): { message: string; details: string[] } {
  if (!validationErrors || validationErrors.length === 0) {
    return {
      message: defaultMessage,
      details: []
    };
  }

  // Se há apenas um erro, usar como mensagem principal
  if (validationErrors.length === 1) {
    return {
      message: validationErrors[0],
      details: []
    };
  }

  // Se há múltiplos erros, usar mensagem genérica e detalhes
  return {
    message: defaultMessage,
    details: validationErrors
  };
}

/**
 * Cria uma resposta de erro padronizada para validação
 *
 * @param validationErrors - Array de mensagens de erro do class-validator
 * @param path - Caminho da requisição
 * @param defaultMessage - Mensagem padrão
 * @returns HttpException com formato padronizado
 */
export function createValidationErrorResponse(
  validationErrors: string[],
  path: string,
  defaultMessage: string = 'Dados inválidos fornecidos'
): HttpException {
  const { message, details } = formatValidationErrors(validationErrors, defaultMessage);

  const errorResponse: StandardErrorResponse = {
    statusCode: HttpStatus.BAD_REQUEST,
    timestamp: new Date().toISOString(),
    path,
    message,
    details: details.length > 0 ? details : undefined,
    error: 'Bad Request'
  };

  return new HttpException(errorResponse, HttpStatus.BAD_REQUEST);
}

/**
 * Cria uma resposta de erro padronizada genérica
 *
 * @param message - Mensagem de erro
 * @param path - Caminho da requisição
 * @param statusCode - Código de status HTTP
 * @param details - Detalhes adicionais (opcional)
 * @returns HttpException com formato padronizado
 */
export function createStandardErrorResponse(
  message: string,
  path: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: string[]
): HttpException {
  const errorResponse: StandardErrorResponse = {
    statusCode,
    timestamp: new Date().toISOString(),
    path,
    message,
    details: details && details.length > 0 ? details : undefined,
    error: getErrorName(statusCode)
  };

  return new HttpException(errorResponse, statusCode);
}

/**
 * Obtém o nome do erro baseado no código de status
 *
 * @param statusCode - Código de status HTTP
 * @returns Nome do erro
 */
function getErrorName(statusCode: number): string {
  switch (statusCode) {
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'Unprocessable Entity';
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return 'Internal Server Error';
    default:
      return 'Error';
  }
}

/**
 * Converte erro de validação do class-validator para formato padronizado
 *
 * @param error - Erro capturado
 * @param path - Caminho da requisição
 * @returns HttpException padronizada
 */
export function handleValidationError(error: any, path: string): HttpException {
  // Se é um erro de validação do class-validator
  if (error.message && Array.isArray(error.message)) {
    return createValidationErrorResponse(error.message, path);
  }

  // Se é um erro de validação com formato específico
  if (error.response && error.response.message && Array.isArray(error.response.message)) {
    return createValidationErrorResponse(error.response.message, path);
  }

  // Se é um erro genérico
  if (error.message && typeof error.message === 'string') {
    return createStandardErrorResponse(error.message, path, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }

  // Erro desconhecido
  return createStandardErrorResponse('Erro interno do servidor', path, HttpStatus.INTERNAL_SERVER_ERROR);
}
