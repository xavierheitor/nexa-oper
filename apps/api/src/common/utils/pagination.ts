export interface PaginationQuery {
  page?: number | string;
  pageSize?: number | string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc' | string;
}

export function buildPagination(query: PaginationQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const orderBy = query.sortBy
    ? { [query.sortBy]: (query.sortDir?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc' }
    : undefined;
  return { page, pageSize, skip, take, orderBy } as const;
}

export function buildPagedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    data: items,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  } as const;
}

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
