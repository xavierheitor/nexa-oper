/**
 * Utilitário para Desempacotamento de Respostas de Server Actions
 *
 * Este módulo fornece uma função utilitária para normalizar respostas
 * de Server Actions que podem retornar tanto arrays simples quanto
 * resultados paginados, simplificando o consumo de dados no frontend.
 *
 * FUNCIONALIDADES:
 * - Desempacotamento automático de ActionResult
 * - Normalização de arrays simples e resultados paginados
 * - Tratamento de erros padronizado
 * - Propagação correta de redirecionamentos Next.js
 * - Type safety completo com TypeScript genérico
 * - Compatibilidade com SWR e React Query
 * - Simplificação do consumo de APIs
 *
 * COMO FUNCIONA:
 * 1. Recebe um fetcher que retorna ActionResult<T[] | PaginatedResult<T>>
 * 2. Executa o fetcher com os parâmetros fornecidos
 * 3. Verifica se a operação foi bem-sucedida
 * 4. Se houver redirecionamento (NEXT_REDIRECT), propaga sem modificar
 * 5. Se houver erro, lança exceção com mensagem clara
 * 6. Se os dados forem array simples, retorna diretamente
 * 7. Se forem paginados, extrai apenas o array de dados
 * 8. Sempre retorna T[] independente do formato original
 *
 * BENEFÍCIOS:
 * - Abstrai complexidade de diferentes formatos de resposta
 * - Reduz boilerplate no frontend
 * - Integração perfeita com hooks de data fetching
 * - Tratamento consistente de erros
 * - Type safety garantido
 * - Reutilização em múltiplas partes da aplicação
 *
 * CASOS DE USO:
 * - Integração com SWR para data fetching
 * - Normalização de respostas de listagem
 * - Simplificação de hooks customizados
 * - Padronização de consumo de APIs
 * - Tratamento uniforme de paginação
 *
 * EXEMPLO DE USO BÁSICO:
 * ```typescript
 * // Fetcher que pode retornar array ou paginado
 * const fetchContratos = (params) => listContratos(params);
 *
 * // Wrapper que sempre retorna array
 * const unwrappedFetcher = unwrapFetcher(fetchContratos);
 *
 * // Uso direto
 * const contratos = await unwrappedFetcher({ page: 1, pageSize: 10 });
 * console.log(contratos); // Sempre T[], nunca PaginatedResult<T>
 * ```
 *
 * EXEMPLO COM SWR:
 * ```typescript
 * // Hook customizado com SWR
 * function useContratos(params: ContratoFilter) {
 *   const { data, error, isLoading } = useSWR(
 *     ['contratos', params],
 *     () => unwrapFetcher(listContratos)(params)
 *   );
 *
 *   return {
 *     contratos: data || [], // Sempre array, nunca undefined
 *     error,
 *     isLoading
 *   };
 * }
 *
 * // Uso no componente
 * const { contratos, error, isLoading } = useContratos({ page: 1 });
 * ```
 *
 * EXEMPLO COM REACT QUERY:
 * ```typescript
 * // Query com unwrapper
 * const { data: contratos } = useQuery({
 *   queryKey: ['contratos', filters],
 *   queryFn: () => unwrapFetcher(listContratos)(filters),
 *   select: (data) => data // data já é T[], não precisa de .data
 * });
 * ```
 *
 * EXEMPLO DE DIFERENTES FORMATOS:
 * ```typescript
 * // Server Action que retorna array simples
 * const simpleAction = async () => ({
 *   success: true,
 *   data: [{ id: 1, name: 'Item 1' }]
 * });
 *
 * // Server Action que retorna paginado
 * const paginatedAction = async () => ({
 *   success: true,
 *   data: {
 *     data: [{ id: 1, name: 'Item 1' }],
 *     total: 1,
 *     page: 1,
 *     pageSize: 10,
 *     totalPages: 1
 *   }
 * });
 *
 * // Ambos funcionam com o mesmo wrapper
 * const items1 = await unwrapFetcher(simpleAction)();
 * const items2 = await unwrapFetcher(paginatedAction)();
 * // items1 e items2 têm o mesmo formato: T[]
 * ```
 */

import { ActionResult, PaginatedResult, PaginatedParams } from '../../types/common';

/**
 * Cria um wrapper que desempacota respostas de Server Actions
 *
 * Esta função transforma um fetcher que retorna ActionResult<T[] | PaginatedResult<T>>
 * em um fetcher que sempre retorna T[], abstraindo a complexidade dos diferentes
 * formatos de resposta e simplificando o consumo no frontend.
 *
 * @template T - Tipo dos itens no array
 * @param fetcher - Função que executa a Server Action e retorna ActionResult
 * @returns Função wrapper que sempre retorna Promise<T[]>
 *
 * @throws {Error} Quando a Server Action retorna success: false
 *
 * @example
 * ```typescript
 * // Wrapper para listagem de contratos
 * const getContratosList = unwrapFetcher(listContratos);
 *
 * // Uso com parâmetros
 * const contratos = await getContratosList({
 *   page: 1,
 *   pageSize: 20,
 *   search: 'contrato teste'
 * });
 *
 * // contratos é sempre T[], independente se a API retornou
 * // array simples ou resultado paginado
 * ```
 */
export function unwrapFetcher<T>(
  fetcher: (params?: PaginatedParams) => Promise<ActionResult<T[] | PaginatedResult<T>>>
) {
  return async (params?: PaginatedParams): Promise<T[]> => {
    try {
      // Executa o fetcher original
      const res = await fetcher(params);

      // Verifica se a operação foi bem-sucedida
      if (!res.success) {
        // Se é erro de autenticação, redireciona para login
        if (res.redirectToLogin) {
          // Usar window.location para forçar redirecionamento no cliente
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        throw new Error(res.error ?? 'Erro ao buscar dados.');
      }

      const data = res.data;

      // Se os dados são um array simples, retorna diretamente
      if (Array.isArray(data)) {
        return data;
      }

      // Se os dados são paginados, extrai apenas o array
      return (data as PaginatedResult<T>).data;
    } catch (error) {
      // Para outros erros, trata normalmente
      throw error instanceof Error
        ? error
        : new Error('Erro desconhecido ao buscar dados.');
    }
  };
}
