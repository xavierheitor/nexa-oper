/**
 * Utilitários para Construção de WHERE Clauses
 *
 * Centraliza lógica comum de construção de filtros Prisma
 * para evitar duplicação entre diferentes módulos.
 */

/**
 * Opções para busca em múltiplos campos
 */
export interface SearchFields {
  [fieldName: string]: boolean;
}

/**
 * Opções para construção de WHERE clause
 */
export interface WhereClauseOptions {
  search?: string;
  searchFields?: SearchFields;
  contractId?: number;
  allowedContractIds?: number[] | null;
  includeDeleted?: boolean;
  additionalFilters?: Record<string, any>;
}

/**
 * Constrói cláusula WHERE base com deletedAt: null
 * @param includeDeleted - Se true, não filtra por deletedAt
 */
export function buildBaseWhereClause(
  includeDeleted = false
): Record<string, any> {
  if (includeDeleted) {
    return {};
  }
  return {
    deletedAt: null,
  };
}

/**
 * Constrói filtro de busca em múltiplos campos usando OR
 *
 * @param search - Termo de busca
 * @param fields - Objeto com campos a buscar (chave = nome do campo, valor = incluir no OR)
 * @returns Filtro OR para busca ou undefined se não houver busca
 *
 * @example
 * ```typescript
 * const searchFilter = buildSearchWhereClause('teste', {
 *   nome: true,
 *   matricula: true,
 *   telefone: true
 * });
 * // Retorna: { OR: [{ nome: { contains: 'teste', mode: 'insensitive' } }, ...] }
 * ```
 */
export function buildSearchWhereClause(
  search?: string,
  fields?: SearchFields
): { OR: Array<Record<string, any>> } | undefined {
  if (!search || !fields) {
    return undefined;
  }

  const term = search.trim();
  if (!term) {
    return undefined;
  }

  const orConditions: Array<Record<string, any>> = [];

  for (const [fieldName, include] of Object.entries(fields)) {
    if (include) {
      orConditions.push({
        [fieldName]: {
          contains: term,
          mode: 'insensitive' as const,
        },
      });
    }
  }

  return orConditions.length > 0 ? { OR: orConditions } : undefined;
}

/**
 * Constrói filtro de contrato (contratoId ou lista de contratos permitidos)
 *
 * @param contractId - ID do contrato específico (opcional)
 * @param allowedContractIds - Lista de IDs de contratos permitidos (opcional)
 * @returns Filtro de contrato ou undefined
 *
 * @example
 * ```typescript
 * // Contrato específico
 * const filter = buildContractFilter(5);
 * // Retorna: { contratoId: 5 }
 *
 * // Lista de contratos permitidos
 * const filter = buildContractFilter(undefined, [1, 2, 3]);
 * // Retorna: { contratoId: { in: [1, 2, 3] } }
 * ```
 */
export function buildContractFilter(
  contractId?: number,
  allowedContractIds?: number[] | null
): { contratoId: number | { in: number[] } } | undefined {
  if (contractId) {
    return { contratoId: contractId };
  }

  if (allowedContractIds && allowedContractIds.length > 0) {
    return { contratoId: { in: allowedContractIds } };
  }

  return undefined;
}

/**
 * Constrói cláusula WHERE completa com busca, contrato e filtros adicionais
 *
 * @param options - Opções para construção da WHERE clause
 * @returns Cláusula WHERE completa
 *
 * @example
 * ```typescript
 * const where = buildWhereClause({
 *   search: 'teste',
 *   searchFields: { nome: true, matricula: true },
 *   contractId: 5,
 *   additionalFilters: { estado: 'ATIVO' }
 * });
 * ```
 */
export function buildWhereClause(
  options: WhereClauseOptions
): Record<string, any> {
  const where: Record<string, any> = buildBaseWhereClause(
    options.includeDeleted
  );

  // Adicionar busca
  const searchFilter = buildSearchWhereClause(
    options.search,
    options.searchFields
  );
  if (searchFilter) {
    Object.assign(where, searchFilter);
  }

  // Adicionar filtro de contrato
  const contractFilter = buildContractFilter(
    options.contractId,
    options.allowedContractIds
  );
  if (contractFilter) {
    Object.assign(where, contractFilter);
  }

  // Adicionar filtros adicionais
  if (options.additionalFilters) {
    Object.assign(where, options.additionalFilters);
  }

  return where;
}
