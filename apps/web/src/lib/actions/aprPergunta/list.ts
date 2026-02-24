/**
 * Server Action para Listagem de APR Perguntas
 *
 * Esta Server Action implementa a listagem paginada de perguntas APR
 * com suporte a filtros, ordenação e busca textual.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada com controle de página e tamanho
 * - Ordenação por qualquer campo válido
 * - Busca textual nos campos configurados
 * - Filtros personalizados via query parameters
 * - Validação automática de parâmetros
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 *
 * PARÂMETROS SUPORTADOS:
 * - page: Número da página (obrigatório)
 * - pageSize: Itens por página (obrigatório)
 * - orderBy: Campo para ordenação (obrigatório)
 * - orderDir: Direção da ordenação - 'asc' ou 'desc'
 * - search: Termo de busca textual (opcional)
 * - include: Relacionamentos a incluir (opcional)
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await listAprPerguntas({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   search: 'EPI'
 * });
 *
 * if (result.success) {
 *   console.log(`${result.data.total} perguntas encontradas`);
 *   console.log('Perguntas:', result.data.data);
 * }
 * ```
 */

'use server';

import type { AprPerguntaService } from '@/lib/services/apr/AprPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprPerguntaFilterSchema } from '../../schemas/aprPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para listar perguntas APR com paginação
 *
 * Processa a listagem de perguntas APR aplicando filtros,
 * paginação e ordenação conforme os parâmetros fornecidos.
 *
 * @param rawData - Parâmetros de filtro e paginação do frontend
 * @returns Promise<ActionResult<PaginatedResult<AprPergunta>>> - Lista paginada
 *
 * @throws {ValidationError} Se os parâmetros forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 *
 * @example
 * ```typescript
 * // Uso com SWR para cache automático
 * const { data: perguntas, error } = useSWR(
 *   ['apr-perguntas', { page: 1, pageSize: 10 }],
 *   ([_, params]) => listAprPerguntas(params)
 * );
 *
 * // Uso direto em componente
 * const loadPerguntas = async () => {
 *   const result = await listAprPerguntas({
 *     page: currentPage,
 *     pageSize: 20,
 *     orderBy: 'nome',
 *     orderDir: 'asc'
 *   });
 *
 *   if (result.success) {
 *     setPerguntas(result.data.data);
 *     setTotal(result.data.total);
 *   }
 * };
 * ```
 */
export const listAprPerguntas = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para parâmetros de listagem
    aprPerguntaFilterSchema,

    // Lógica de listagem
    async (validatedParams, _session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprPerguntaService>('aprPerguntaService');

      // Executa listagem com parâmetros validados
      return service.list(validatedParams);
    },

    // Parâmetros brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprPergunta',
      actionType: 'list',
    }
  );
