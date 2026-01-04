/**
 * Server Action para Listagem de APR Opções de Resposta
 *
 * Esta Server Action implementa a listagem paginada de opções de resposta APR
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
 * const result = await listAprOpcoesResposta({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   search: 'Conforme'
 * });
 *
 * if (result.success) {
 *   console.log(`${result.data.total} opções de resposta encontradas`);
 *   console.log('Opções:', result.data.data);
 * }
 * ```
 */

'use server';

import type { AprOpcaoRespostaService } from '@/lib/services/apr/AprOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { aprOpcaoRespostaFilterSchema } from '../../schemas/aprOpcaoRespostaSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para listar opções de resposta APR com paginação
 *
 * Processa a listagem de opções de resposta APR aplicando filtros,
 * paginação e ordenação conforme os parâmetros fornecidos.
 *
 * @param rawData - Parâmetros de filtro e paginação do frontend
 * @returns Promise<ActionResult<PaginatedResult<AprOpcaoResposta>>> - Lista paginada
 *
 * @throws {ValidationError} Se os parâmetros forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 *
 * @example
 * ```typescript
 * // Uso com SWR para cache automático
 * const { data: opcoes, error } = useSWR(
 *   ['apr-opcoes-resposta', { page: 1, pageSize: 10 }],
 *   ([_, params]) => listAprOpcoesResposta(params)
 * );
 *
 * // Uso direto em componente
 * const loadOpcoes = async () => {
 *   const result = await listAprOpcoesResposta({
 *     page: currentPage,
 *     pageSize: 20,
 *     orderBy: 'nome',
 *     orderDir: 'asc'
 *   });
 *
 *   if (result.success) {
 *     setOpcoes(result.data.data);
 *     setTotal(result.data.total);
 *   }
 * };
 * ```
 */
export const listAprOpcoesResposta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para parâmetros de listagem
    aprOpcaoRespostaFilterSchema,

    // Lógica de listagem
    async (validatedParams, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprOpcaoRespostaService>(
        'aprOpcaoRespostaService'
      );

      // Executa listagem com parâmetros validados
      return service.list(validatedParams);
    },

    // Parâmetros brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprOpcaoResposta',
      actionType: 'list',
    }
  );
