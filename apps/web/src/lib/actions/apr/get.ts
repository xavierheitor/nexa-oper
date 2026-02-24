/**
 * Server Action para Busca Individual de APR
 *
 * Esta Server Action implementa a busca de uma APR específica
 * por ID, com validação e tratamento completo de erros.
 *
 * FUNCIONALIDADES:
 * - Busca individual por ID único
 * - Validação de ID de entrada
 * - Retorna apenas registros ativos (não deletados)
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 *
 * COMPORTAMENTO:
 * - Busca apenas APRs ativas (deletedAt = null)
 * - Retorna null se não encontrar
 * - Valida ID antes da busca
 * - Registra acesso para auditoria
 *
 * CASOS DE USO:
 * - Carregar dados para edição
 * - Exibir detalhes de uma APR
 * - Validar existência antes de operações
 * - Carregar dados para formulários
 * - Carregar relacionamentos para Transfer components
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await getApr({ id: 1 });
 *
 * if (result.success && result.data) {
 *   console.log('APR encontrada:', result.data);
 * } else if (result.success && !result.data) {
 *   console.log('APR não encontrada');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprService } from '@/lib/services/apr/AprService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

/**
 * Schema de validação para busca de APR por ID
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const getAprSchema = z.object({
  /** ID único da APR a ser buscada (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para buscar APR por ID
 *
 * Processa a busca individual de uma APR específica,
 * retornando apenas registros ativos (não deletados).
 *
 * @param rawData - Dados brutos contendo ID da APR
 * @returns Promise<ActionResult<Apr | null>> - APR encontrada ou null
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso para carregamento de dados de edição
 * const loadAprForEdit = async (aprId) => {
 *   const result = await getApr({ id: aprId });
 *
 *   if (result.success && result.data) {
 *     setFormData({
 *       id: result.data.id,
 *       nome: result.data.nome
 *     });
 *     setEditMode(true);
 *   } else if (result.success && !result.data) {
 *     message.warning('APR não encontrada');
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso para validação de existência
 * const validateAprExists = async (aprId) => {
 *   const result = await getApr({ id: aprId });
 *   return result.success && result.data !== null;
 * };
 *
 * // Uso em modal de detalhes
 * const showAprDetails = async (aprId) => {
 *   setLoading(true);
 *
 *   const result = await getApr({ id: aprId });
 *
 *   if (result.success && result.data) {
 *     setSelectedApr(result.data);
 *     setModalVisible(true);
 *   } else {
 *     message.error('Não foi possível carregar os detalhes');
 *   }
 *
 *   setLoading(false);
 * };
 *
 * // Uso com React Query para cache
 * const { data: apr, isLoading, error } = useQuery({
 *   queryKey: ['apr', aprId],
 *   queryFn: () => getApr({ id: aprId }),
 *   enabled: !!aprId
 * });
 *
 * // Uso para carregar dados para Transfer components
 * const loadAprForTransfer = async (aprId) => {
 *   const result = await getApr({
 *     id: aprId,
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
 *   if (result.success && result.data) {
 *     // Extrair IDs para Transfer components
 *     const perguntaIds = result.data.AprPerguntaRelacao?.map(
 *       rel => rel.aprPerguntaId
 *     ) || [];
 *     const opcaoIds = result.data.AprOpcaoRespostaRelacao?.map(
 *       rel => rel.aprOpcaoRespostaId
 *     ) || [];
 *
 *     setSelectedPerguntas(perguntaIds);
 *     setSelectedOpcoes(opcaoIds);
 *   }
 * };
 * ```
 */
export const getApr = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    getAprSchema,

    // Lógica de negócio
    async (validatedData, _session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprService>('aprService');

      // Executa busca por ID
      return service.getById(validatedData.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'Apr',
      actionType: 'get',
    }
  );
