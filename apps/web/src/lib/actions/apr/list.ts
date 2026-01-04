/**
 * Server Action para Listagem de APRs
 *
 * Esta Server Action implementa a listagem paginada de APRs (Análise Preliminar de Risco)
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
 * - Suporte a includes para relacionamentos
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
 * const result = await listAprs({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   search: 'Soldagem',
 *   include: {
 *     AprPerguntaRelacao: true,
 *     AprOpcaoRespostaRelacao: true
 *   }
 * });
 *
 * if (result.success) {
 *   console.log(`${result.data.total} APRs encontradas`);
 *   console.log('APRs:', result.data.data);
 * }
 * ```
 */

'use server';

import type { AprService } from '@/lib/services/apr/AprService';
import { container } from '@/lib/services/common/registerServices';
import { aprFilterSchema } from '../../schemas/aprSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para listar APRs com paginação
 *
 * Processa a listagem de APRs aplicando filtros,
 * paginação e ordenação conforme os parâmetros fornecidos.
 *
 * @param rawData - Parâmetros de filtro e paginação do frontend
 * @returns Promise<ActionResult<PaginatedResult<Apr>>> - Lista paginada
 *
 * @throws {ValidationError} Se os parâmetros forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 *
 * @example
 * ```typescript
 * // Uso com SWR para cache automático
 * const { data: aprs, error } = useSWR(
 *   ['aprs', { page: 1, pageSize: 10 }],
 *   ([_, params]) => listAprs(params)
 * );
 *
 * // Uso direto em componente
 * const loadAprs = async () => {
 *   const result = await listAprs({
 *     page: currentPage,
 *     pageSize: 20,
 *     orderBy: 'nome',
 *     orderDir: 'asc',
 *     include: {
 *       AprPerguntaRelacao: {
 *         include: { aprPergunta: true }
 *       },
 *       AprOpcaoRespostaRelacao: {
 *         include: { aprOpcaoResposta: true }
 *       }
 *     }
 *   });
 *
 *   if (result.success) {
 *     setAprs(result.data.data);
 *     setTotal(result.data.total);
 *   }
 * };
 *
 * // Uso com Transfer components
 * const loadAprsForTransfer = async () => {
 *   const result = await listAprs({
 *     page: 1,
 *     pageSize: 1000, // Carregar muitos para Transfer
 *     orderBy: 'nome',
 *     orderDir: 'asc'
 *   });
 *
 *   if (result.success) {
 *     const transferItems = result.data.data.map(apr => ({
 *       key: apr.id.toString(),
 *       title: apr.nome
 *     }));
 *     setTransferData(transferItems);
 *   }
 * };
 * ```
 */
export const listAprs = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para parâmetros de listagem
    aprFilterSchema,

    // Lógica de listagem
    async (validatedParams, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprService>('aprService');

      // Executa listagem com parâmetros validados
      return service.list(validatedParams);
    },

    // Parâmetros brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'Apr',
      actionType: 'list',
    }
  );
