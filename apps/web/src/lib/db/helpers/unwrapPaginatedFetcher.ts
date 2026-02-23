/**
 * Utilitário para Desempacotamento de Respostas Paginadas de Server Actions
 *
 * Este módulo fornece uma função utilitária para normalizar respostas
 * de Server Actions que retornam resultados paginados, preservando
 * metadados de paginação (total, totalPages) necessários para componentes
 * que renderizam paginação.
 *
 * DIFERENÇA DO unwrapFetcher:
 * - unwrapFetcher: Retorna apenas o array de dados (para dropdowns)
 * - unwrapPaginatedFetcher: Preserva metadados de paginação (para tabelas)
 *
 * FUNCIONALIDADES:
 * - Desempacotamento automático de ActionResult
 * - Preservação de metadados de paginação (total, totalPages)
 * - Tratamento de erros padronizado
 * - Type safety completo com TypeScript genérico
 * - Compatibilidade com useEntityData
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const eletricistas = useEntityData<Eletricista>({
 *   key: 'eletricistas',
 *   fetcher: unwrapPaginatedFetcher(listEletricistas), // ✅ Preserva total
 *   paginationEnabled: true,
 * });
 * ```
 */

import { ActionResult, PaginatedResult } from '../../types/common';
import { handleRedirectToLogin } from '../../utils/redirectHandler';

/**
 * Cria um wrapper que desempacota respostas paginadas de Server Actions
 *
 * Esta função transforma um fetcher que retorna ActionResult<PaginatedResult<T>>
 * em um fetcher que retorna PaginatedResult<T>, preservando todos os metadados
 * de paginação necessários para componentes de tabela.
 *
 * @template T - Tipo dos itens no array
 * @param fetcher - Função que executa a Server Action e retorna ActionResult
 * @returns Função wrapper que retorna Promise<PaginatedResult<T>>
 *
 * @throws {Error} Quando a Server Action retorna success: false
 *
 * @example
 * ```typescript
 * const getEletricistasList = unwrapPaginatedFetcher(listEletricistas);
 *
 * const result = await getEletricistasList({
 *   page: 1,
 *   pageSize: 10,
 * });
 *
 * console.log(result.data);       // Array de eletricistas
 * console.log(result.total);      // 308
 * console.log(result.totalPages); // 31
 * ```
 */
export function unwrapPaginatedFetcher<T>(
  fetcher: (params?: any) => Promise<ActionResult<PaginatedResult<T>>>
) {
  return async (params?: any): Promise<PaginatedResult<T>> => {
    try {
      // Executa o fetcher original
      const res = await fetcher(params);

      // Verifica se a operação foi bem-sucedida
      if (!res.success) {
        if (handleRedirectToLogin(res)) {
          throw new Error('Sessão expirada. Redirecionando para login.');
        }
        throw new Error(res.error ?? 'Erro ao buscar dados.');
      }

      const data = res.data;

      // Se for paginado, retorna com todos os metadados
      if (data && typeof data === 'object' && 'data' in data) {
        return data as PaginatedResult<T>;
      }

      // Se for array simples (fallback), cria resultado paginado
      if (Array.isArray(data)) {
        const arrayData = data as T[];
        return {
          data: arrayData,
          total: arrayData.length,
          totalPages: 1,
          page: 1,
          pageSize: arrayData.length || 10,
        };
      }

      // Fallback seguro
      return {
        data: [],
        total: 0,
        totalPages: 0,
        page: 1,
        pageSize: 10,
      };
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Erro desconhecido ao buscar dados.');
    }
  };
}
