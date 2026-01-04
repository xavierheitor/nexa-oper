/**
 * Tipos e Interfaces para Construção de Filtros Customizados
 *
 * Este arquivo define a estrutura padronizada para filtros customizados
 * em repositories, permitindo extensibilidade mantendo consistência.
 *
 * FUNCIONALIDADES:
 * - Interface padronizada para filtros customizados
 * - Builder pattern para construção de filtros complexos
 * - Suporte a filtros aninhados e relacionamentos
 * - Type safety completo
 */

import type { PaginationParams } from './common';
import type { GenericPrismaWhereInput } from './prisma';

/**
 * Interface base para filtros customizados
 * Todos os filtros devem estender PaginationParams e adicionar campos específicos
 */
export interface BaseCustomFilter extends PaginationParams {
  // Campos de paginação já estão em PaginationParams
  // Adicione campos específicos do filtro aqui
}

/**
 * Interface para construção de filtros customizados
 * Permite adicionar filtros específicos de forma padronizada
 */
export interface CustomFilterBuilder {
  /**
   * Adiciona filtro de busca por texto
   */
  addSearch(search: string | undefined, fields: string[]): this;

  /**
   * Adiciona filtro de relacionamento
   */
  addRelationFilter(relation: string, filter: Record<string, unknown>): this;

  /**
   * Adiciona filtro de data (range)
   */
  addDateRange(field: string, start?: Date, end?: Date): this;

  /**
   * Adiciona filtro customizado
   */
  addCustomFilter(filter: Record<string, unknown>): this;

  /**
   * Constrói o objeto where final
   */
  build(): GenericPrismaWhereInput;
}

/**
 * Classe helper para construção de filtros customizados
 * Implementa o padrão Builder para facilitar construção de filtros complexos
 */
export class FilterBuilder implements CustomFilterBuilder {
  private where: GenericPrismaWhereInput = {};

  /**
   * Adiciona filtro de busca por texto
   */
  addSearch(search: string | undefined, fields: string[]): this {
    if (search && fields.length > 0) {
      const searchConditions = fields.map(field => ({
        [field]: { contains: search },
      }));

      if (searchConditions.length === 1) {
        Object.assign(this.where, searchConditions[0]);
      } else {
        this.where.OR = searchConditions;
      }
    }
    return this;
  }

  /**
   * Adiciona filtro de relacionamento
   */
  addRelationFilter(relation: string, filter: Record<string, unknown>): this {
    if (Object.keys(filter).length > 0) {
      this.where[relation] = filter;
    }
    return this;
  }

  /**
   * Adiciona filtro de data (range)
   */
  addDateRange(field: string, start?: Date, end?: Date): this {
    if (start || end) {
      const dateFilter: Record<string, unknown> = {};
      if (start) {
        dateFilter.gte = start;
      }
      if (end) {
        dateFilter.lte = end;
      }
      this.where[field] = dateFilter;
    }
    return this;
  }

  /**
   * Adiciona filtro customizado
   */
  addCustomFilter(filter: Record<string, unknown>): this {
    Object.assign(this.where, filter);
    return this;
  }

  /**
   * Adiciona filtro de igualdade
   */
  addEquals(field: string, value: unknown): this {
    if (value !== undefined && value !== null) {
      this.where[field] = value;
    }
    return this;
  }

  /**
   * Adiciona filtro de array (IN)
   */
  addIn(field: string, values: unknown[]): this {
    if (values && values.length > 0) {
      this.where[field] = { in: values };
    }
    return this;
  }

  /**
   * Adiciona filtro de soft delete (deletedAt: null)
   */
  addSoftDelete(): this {
    this.where.deletedAt = null;
    return this;
  }

  /**
   * Constrói o objeto where final
   */
  build(): GenericPrismaWhereInput {
    return this.where;
  }

  /**
   * Reseta o builder
   */
  reset(): this {
    this.where = {};
    return this;
  }
}

