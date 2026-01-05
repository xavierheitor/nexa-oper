/**
 * Server Action para Listagem de Vínculos APR-TipoAtividade
 *
 * Esta Server Action implementa a listagem paginada de vínculos
 * entre APRs e Tipos de Atividade com suporte a filtros,
 * ordenação e includes para relacionamentos.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada com controle de página e tamanho
 * - Ordenação por qualquer campo válido
 * - Filtros personalizados via query parameters
 * - Validação automática de parâmetros
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Includes automáticos para APR e TipoAtividade
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
 * const result = await listAprTipoAtividadeVinculos({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'id',
 *   orderDir: 'desc',
 *   include: {
 *     apr: true,
 *     tipoAtividade: true
 *   }
 * });
 *
 * if (result.success) {
 *   console.log(`${result.data.total} vínculos encontrados`);
 *   console.log('Vínculos:', result.data.data);
 * }
 * ```
 */

'use server';

import { handleServerAction } from '@/lib/actions/common/actionHandler';
import { aprTipoAtividadeVinculoFilterSchema } from '@/lib/schemas/aprTipoAtividadeVinculoSchema';
import type { AprTipoAtividadeVinculoService } from '@/lib/services/apr/AprTipoAtividadeVinculoService';
import { container } from '@/lib/services/common/registerServices';


/**
 * Server Action para listar vínculos APR-TipoAtividade com paginação
 *
 * Processa a listagem de vínculos aplicando filtros,
 * paginação e ordenação conforme os parâmetros fornecidos.
 * Inclui automaticamente dados da APR e Tipo de Atividade.
 *
 * @param rawData - Parâmetros de filtro e paginação do frontend
 * @returns Promise<ActionResult<PaginatedResult<AprTipoAtividadeRelacao>>> - Lista paginada
 *
 * @throws {ValidationError} Se os parâmetros forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 *
 * @example
 * ```typescript
 * // Uso com SWR para cache automático
 * const { data: vinculos, error } = useSWR(
 *   ['apr-tipo-atividade-vinculos', { page: 1, pageSize: 10 }],
 *   ([_, params]) => listAprTipoAtividadeVinculos(params)
 * );
 *
 * // Uso direto em componente
 * const loadVinculos = async () => {
 *   const result = await listAprTipoAtividadeVinculos({
 *     page: currentPage,
 *     pageSize: 20,
 *     orderBy: 'tipoAtividade',
 *     orderDir: 'asc'
 *   });
 *
 *   if (result.success) {
 *     setVinculos(result.data.data);
 *     setTotal(result.data.total);
 *   }
 * };
 *
 * // Uso para exibição em tabela
 * const loadVinculosTable = async () => {
 *   const result = await listAprTipoAtividadeVinculos({
 *     page: 1,
 *     pageSize: 50,
 *     orderBy: 'id',
 *     orderDir: 'desc',
 *     include: {
 *       apr: { select: { id: true, nome: true } },
 *       tipoAtividade: { select: { id: true, nome: true } }
 *     }
 *   });
 *
 *   if (result.success) {
 *     const tableData = result.data.data.map(vinculo => ({
 *       id: vinculo.id,
 *       tipoAtividade: vinculo.tipoAtividade.nome,
 *       apr: vinculo.apr.nome,
 *       createdAt: vinculo.createdAt
 *     }));
 *     setTableData(tableData);
 *   }
 * };
 * ```
 */
export const listAprTipoAtividadeVinculos = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para parâmetros de listagem
    aprTipoAtividadeVinculoFilterSchema,
    // Lógica de listagem
    async (validatedParams, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprTipoAtividadeVinculoService>('aprTipoAtividadeVinculoService');
      // Executa listagem com parâmetros validados
      return service.list(validatedParams);
    },
    // Parâmetros brutos para validação
    rawData,
    // Metadados para logging e auditoria
    {
      entityName: 'AprTipoAtividadeRelacao',
      actionType: 'list'
    }
  );

