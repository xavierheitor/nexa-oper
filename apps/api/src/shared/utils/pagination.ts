/**
 * Utilitários de Paginação Compartilhados
 *
 * Centraliza lógica comum de paginação para evitar duplicação
 * entre diferentes módulos da aplicação.
 */

import { BadRequestException } from '@nestjs/common';
import { PaginationMetaDto } from '../dto/pagination-meta.dto';

/**
 * Configurações padrão de paginação
 */
export const PAGINATION_DEFAULTS = {
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
} as const;

/**
 * Valida parâmetros de paginação
 */
export function validatePaginationParams(page: number, limit: number): void {
  if (page < PAGINATION_DEFAULTS.MIN_PAGE) {
    throw new BadRequestException('Página deve ser maior que 0');
  }

  if (
    limit < PAGINATION_DEFAULTS.MIN_LIMIT ||
    limit > PAGINATION_DEFAULTS.MAX_LIMIT
  ) {
    throw new BadRequestException(
      `Limite deve estar entre ${PAGINATION_DEFAULTS.MIN_LIMIT} e ${PAGINATION_DEFAULTS.MAX_LIMIT}`
    );
  }
}

/**
 * Constrói metadados de paginação
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMetaDto {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}

/**
 * Calcula offset para consultas paginadas
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Normaliza parâmetros de paginação com valores padrão
 */
export function normalizePaginationParams(
  page?: number,
  limit?: number
): { page: number; limit: number } {
  return {
    page: page || PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit: limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT,
  };
}
