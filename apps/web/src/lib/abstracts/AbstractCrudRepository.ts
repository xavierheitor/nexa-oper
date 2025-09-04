/**
 * Classe Abstrata para Repositórios CRUD
 *
 * Esta classe fornece uma implementação base para repositórios
 * que implementam operações CRUD, incluindo paginação, ordenação
 * e busca automática.
 *
 * FUNCIONALIDADES:
 * - Implementação base de operações CRUD
 * - Paginação automática
 * - Ordenação configurável
 * - Busca em múltiplos campos
 * - Soft delete com auditoria
 *
 * COMO USAR:
 *
 * export class ContratoRepository extends AbstractCrudRepository<Contrato, ContratoFilter> {
 *   protected getSearchFields() {
 *     return ['nome', 'numero'];
 *   }
 *
 *   protected findMany(where, orderBy, skip, take) {
 *     return prisma.contrato.findMany({ where, orderBy, skip, take });
 *   }
 * }
 * ```
 */

import { QueryBuilder } from '../db/helpers/queryBuilder';
import { ICrudRepository } from '../interfaces/ICrudRepository';
import type { PaginationParams } from '../types/common';

export abstract class AbstractCrudRepository<T, F extends PaginationParams>
  implements ICrudRepository<T, F>
{
  // Métodos abstratos que devem ser implementados pelas classes filhas
  abstract create(data: any): Promise<T>;
  abstract update(id: any, data: any): Promise<T>;
  abstract delete(id: any, userId: string): Promise<T>;
  abstract findById(id: any): Promise<T | null>;

  /**
   * Define quais campos podem ser utilizados para busca
   * Deve ser implementado por cada repositório concreto
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected abstract getSearchFields(): string[];

  /**
   * Executa a consulta findMany no ORM
   * Deve ser implementado por cada repositório concreto
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @returns Array de registros
   */
  protected abstract findMany(
    where: any,
    orderBy: any,
    skip: number,
    take: number
  ): Promise<T[]>;

  /**
   * Executa a consulta count no ORM
   * Deve ser implementado por cada repositório concreto
   *
   * @param where - Condições de filtro
   * @returns Número total de registros
   */
  protected abstract count(where: any): Promise<number>;

  /**
   * Lista registros com paginação, ordenação e busca
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Objeto com items e total
   */
  async list(params: F): Promise<{ items: T[]; total: number }> {
    // Constrói parâmetros da query usando o QueryBuilder
    const queryParams = QueryBuilder.buildQueryParams(
      params,
      this.getSearchFields(),
      { deletedAt: null } // Filtro para soft delete
    );

    // Executa count e findMany em paralelo para melhor performance
    const [total, items] = await Promise.all([
      this.count(queryParams.where),
      this.findMany(
        queryParams.where,
        queryParams.orderBy,
        queryParams.skip,
        queryParams.take
      ),
    ]);

    return { items, total };
  }
}
