/**
 * Query Builder para Prisma
 *
 * Este módulo consolida todas as funções de construção de queries
 * para o Prisma Client, incluindo ordenação, paginação e busca.
 *
 * FUNCIONALIDADES:
 * - Construção de orderBy para Prisma
 * - Construção de where para busca
 * - Construção de paginação
 * - Suporte a múltiplos campos de ordenação
 * - Busca case-insensitive
 *
 * COMO FUNCIONA:
 * 1. Recebe parâmetros de query
 * 2. Constrói objetos compatíveis com Prisma
 * 3. Retorna objetos prontos para uso
 *
 * BENEFÍCIOS:
 * - Consolidação de lógica de query
 * - Reutilização em múltiplos repositórios
 * - Type safety com TypeScript
 * - Código mais limpo e manutenível
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Ordenação simples
 * const orderBy = QueryBuilder.buildOrderBy('name', 'asc');
 * // Resultado: { name: 'asc' }
 *
 * // Busca em múltiplos campos
 * const where = QueryBuilder.buildSearchWhere('joão', ['name', 'email']);
 * // Resultado: { OR: [{ name: { contains: 'joão', mode: 'insensitive' } }, ...] }
 *
 * // Paginação
 * const pagination = QueryBuilder.buildPagination(1, 10);
 * // Resultado: { skip: 0, take: 10 }
 * ```
 */

// Tipo para direção de ordenação
export type OrderDir = 'asc' | 'desc';

/**
 * Classe para construção de queries do Prisma
 *
 * Centraliza toda a lógica de construção de queries,
 * proporcionando uma interface consistente e reutilizável.
 */
export class QueryBuilder {
  /**
   * Constrói um objeto orderBy para o Prisma
   *
   * @param field - Campo para ordenação
   * @param dir - Direção da ordenação
   * @returns Objeto orderBy compatível com Prisma
   */
  static buildOrderBy(field: string, dir: OrderDir) {
    return { [field]: dir };
  }

  /**
   * Constrói um objeto where para busca em múltiplos campos
   *
   * @param search - Termo de busca
   * @param fields - Campos onde buscar
   * @returns Objeto where compatível com Prisma
   */
  static buildSearchWhere(search: string | undefined, fields: string[]) {
    if (!search) return {};

    return {
      OR: fields.map(field => ({
        [field]: {
          contains: search,
          mode: 'insensitive' as const,
        },
      })),
    };
  }

  /**
   * Constrói parâmetros de paginação para o Prisma
   *
   * @param page - Página atual (baseada em 1)
   * @param pageSize - Tamanho da página
   * @returns Objeto com skip e take
   */
  static buildPagination(page: number, pageSize: number) {
    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }

  /**
   * Constrói um objeto where completo com busca e filtros
   *
   * @param search - Termo de busca
   * @param searchFields - Campos onde buscar
   * @param additionalWhere - Filtros adicionais
   * @returns Objeto where completo
   */
  static buildWhere(
    search: string | undefined,
    searchFields: string[],
    additionalWhere: Record<string, any> = {}
  ) {
    const searchWhere = this.buildSearchWhere(search, searchFields);

    return {
      ...additionalWhere,
      ...searchWhere,
    };
  }

  /**
   * Constrói parâmetros completos para uma query paginada
   *
   * @param params - Parâmetros da query
   * @param searchFields - Campos onde buscar
   * @param additionalWhere - Filtros adicionais
   * @returns Objeto com where, orderBy, skip e take
   */
  static buildQueryParams(
    params: {
      page: number;
      pageSize: number;
      orderBy: string;
      orderDir: OrderDir;
      search?: string;
    },
    searchFields: string[],
    additionalWhere: Record<string, any> = {}
  ) {
    const where = this.buildWhere(params.search, searchFields, additionalWhere);
    const orderBy = this.buildOrderBy(params.orderBy, params.orderDir);
    const pagination = this.buildPagination(params.page, params.pageSize);

    return {
      where,
      orderBy,
      ...pagination,
    };
  }
}
