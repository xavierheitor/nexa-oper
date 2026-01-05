/**
 * Classe Abstrata para Repositórios CRUD
 *
 * Esta classe fornece uma implementação base para repositórios
 * que implementam operações CRUD, incluindo paginação, ordenação,
 * busca automática e suporte a filtros customizados.
 *
 * FUNCIONALIDADES:
 * - Implementação base de operações CRUD
 * - Paginação automática padronizada
 * - Ordenação configurável
 * - Busca em múltiplos campos
 * - Soft delete com auditoria
 * - Suporte a filtros customizados via buildCustomFilters()
 * - Suporte a includes padronizados via getDefaultInclude()
 *
 * COMO USAR:
 *
 * ```typescript
 * // Repository simples (usa padrão)
 * export class ContratoRepository extends AbstractCrudRepository<Contrato, ContratoFilter> {
 *   protected getSearchFields() {
 *     return ['nome', 'numero'];
 *   }
 *
 *   protected findMany(where, orderBy, skip, take, include?) {
 *     return prisma.contrato.findMany({ where, orderBy, skip, take, ...(include && { include }) });
 *   }
 *
 *   protected count(where) {
 *     return prisma.contrato.count({ where });
 *   }
 * }
 *
 * // Repository com filtros customizados
 * export class TurnoRepository extends AbstractCrudRepository<Turno, TurnoFilter> {
 *   protected buildCustomFilters(params: TurnoFilter, baseWhere: GenericPrismaWhereInput) {
 *     const where = { ...baseWhere };
 *     if (params.status === 'ABERTO') {
 *       where.dataFim = null;
 *     }
 *     return where;
 *   }
 *
 *   protected getDefaultInclude() {
 *     return { veiculo: true, equipe: true };
 *   }
 * }
 * ```
 */

import { QueryBuilder } from '../db/helpers/queryBuilder';
import { ICrudRepository } from '../interfaces/ICrudRepository';
import type { PaginationParams } from '../types/common';
import type {
  GenericPrismaWhereInput,
  GenericPrismaOrderByInput,
  GenericPrismaIncludeInput,
} from '../types/prisma';

export abstract class AbstractCrudRepository<T, F extends PaginationParams>
  implements ICrudRepository<T, F>
{
  // Métodos abstratos que devem ser implementados pelas classes filhas
  abstract create(data: unknown): Promise<T>;
  abstract update(id: number | string, data: unknown): Promise<T>;
  abstract delete(id: number | string, userId: string): Promise<T>;
  abstract findById(id: number | string): Promise<T | null>;

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
   * @param where - Condições de filtro (tipado com GenericPrismaWhereInput)
   * @param orderBy - Ordenação (tipado com GenericPrismaOrderByInput)
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional, tipado com GenericPrismaIncludeInput)
   * @returns Array de registros
   */
  protected abstract findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<T[]>;

  /**
   * Executa a consulta count no ORM
   * Deve ser implementado por cada repositório concreto
   *
   * @param where - Condições de filtro (tipado com GenericPrismaWhereInput)
   * @returns Número total de registros
   */
  protected abstract count(where: GenericPrismaWhereInput): Promise<number>;

  /**
   * Constrói filtros customizados a partir dos parâmetros
   *
   * Este método pode ser sobrescrito por repositories que precisam
   * de filtros além dos padrões (busca, paginação, soft delete).
   *
   * @param params - Parâmetros de filtro que estendem PaginationParams
   * @param baseWhere - Filtros base já construídos (soft delete, busca, etc)
   * @returns Objeto where com filtros customizados aplicados
   *
   * @example
   * ```typescript
   * protected buildCustomFilters(params: TurnoFilter, baseWhere: GenericPrismaWhereInput) {
   *   const where = { ...baseWhere };
   *   if (params.status === 'ABERTO') {
   *     where.dataFim = null;
   *   }
   *   return where;
   * }
   * ```
   */
  protected buildCustomFilters(
    params: F,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    // Implementação padrão: retorna os filtros base sem modificação
    // Repositories podem sobrescrever este método para adicionar filtros customizados
    return baseWhere;
  }

  /**
   * Retorna o include padrão para consultas
   *
   * Este método pode ser sobrescrito por repositories que precisam
   * de includes padrão em suas consultas.
   *
   * @returns Objeto de include padrão ou undefined
   *
   * @example
   * ```typescript
   * protected getDefaultInclude(): GenericPrismaIncludeInput {
   *   return {
   *     veiculo: true,
   *     equipe: { include: { tipoEquipe: true } }
   *   };
   * }
   * ```
   */
  protected getDefaultInclude(): GenericPrismaIncludeInput | undefined {
    // Implementação padrão: sem includes
    // Repositories podem sobrescrever este método para definir includes padrão
    return undefined;
  }

  /**
   * Verifica se o modelo tem soft delete
   *
   * Repositories podem sobrescrever este método se o modelo não tem soft delete
   *
   * @returns true se o modelo tem soft delete, false caso contrário
   */
  protected hasSoftDelete(): boolean {
    // Por padrão, assume que tem soft delete
    // Repositories sem soft delete devem sobrescrever retornando false
    return true;
  }

  /**
   * Lista registros com paginação, ordenação e busca
   *
   * Este método implementa a lógica padrão de listagem, mas permite
   * customização através de buildCustomFilters() e getDefaultInclude().
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Objeto com items e total
   */
  async list(params: F): Promise<{ items: T[]; total: number }> {
    // Constrói filtros base usando QueryBuilder
    const baseWhere: GenericPrismaWhereInput = {};

    // Adiciona soft delete se o modelo suporta
    if (this.hasSoftDelete()) {
      baseWhere.deletedAt = null;
    }

    // Adiciona busca por texto se fornecido
    if (params.search) {
      const searchFields = this.getSearchFields();
      if (searchFields.length > 0) {
        const searchConditions = searchFields.map(field => ({
          [field]: { contains: params.search },
        }));

        if (searchConditions.length === 1) {
          Object.assign(baseWhere, searchConditions[0]);
        } else {
          baseWhere.OR = searchConditions;
        }
      }
    }

    // Aplica filtros customizados (se implementado)
    const where = this.buildCustomFilters(params, baseWhere);

    // Extrai include dos params ou usa o padrão
    const include =
      (params as PaginationParams & { include?: GenericPrismaIncludeInput })
        .include || this.getDefaultInclude();

    // Constrói paginação
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Constrói ordenação
    const orderBy = QueryBuilder.buildOrderBy(
      params.orderBy || 'id',
      params.orderDir || 'asc'
    );

    // Executa count e findMany em paralelo para melhor performance
    const [total, items] = await Promise.all([
      this.count(where),
      this.findMany(where, orderBy, skip, take, include),
    ]);

    return { items, total };
  }
}
