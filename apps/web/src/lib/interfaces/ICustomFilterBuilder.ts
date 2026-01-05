/**
 * Interface para Repositórios com Filtros Customizados
 *
 * Define o contrato para repositories que precisam de filtros customizados
 * além dos filtros padrão de paginação e busca.
 */

import type { PaginationParams } from '../types/common';
import type { GenericPrismaWhereInput } from '../types/prisma';

/**
 * Interface para construção de filtros customizados em repositories
 *
 * Repositories que precisam de filtros além dos padrões devem implementar
 * este método para construir filtros customizados de forma padronizada
 */
export interface ICustomFilterBuilder<F extends PaginationParams> {
  /**
   * Constrói filtros customizados a partir dos parâmetros
   *
   * @param params - Parâmetros de filtro que estendem PaginationParams
   * @param baseWhere - Filtros base já construídos (soft delete, busca, etc)
   * @returns Objeto where com filtros customizados aplicados
   */
  buildCustomFilters(
    params: F,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput;
}

