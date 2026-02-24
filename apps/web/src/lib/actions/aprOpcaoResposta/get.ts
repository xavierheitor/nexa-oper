/**
 * Server Action para Busca Individual de APR Opção de Resposta
 *
 * Esta Server Action implementa a busca de uma opção de resposta APR específica
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
 * - Busca apenas opções de resposta ativas (deletedAt = null)
 * - Retorna null se não encontrar
 * - Valida ID antes da busca
 * - Registra acesso para auditoria
 *
 * CASOS DE USO:
 * - Carregar dados para edição
 * - Exibir detalhes de uma opção de resposta
 * - Validar existência antes de operações
 * - Carregar dados para formulários
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await getAprOpcaoResposta({ id: 1 });
 *
 * if (result.success && result.data) {
 *   console.log('Opção de resposta encontrada:', result.data);
 * } else if (result.success && !result.data) {
 *   console.log('Opção de resposta não encontrada');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprOpcaoRespostaService } from '@/lib/services/apr/AprOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

/**
 * Schema de validação para busca de opção de resposta APR por ID
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const getAprOpcaoRespostaSchema = z.object({
  /** ID único da opção de resposta a ser buscada (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para buscar opção de resposta APR por ID
 *
 * Processa a busca individual de uma opção de resposta APR específica,
 * retornando apenas registros ativos (não deletados).
 *
 * @param rawData - Dados brutos contendo ID da opção de resposta
 * @returns Promise<ActionResult<AprOpcaoResposta | null>> - Opção de resposta encontrada ou null
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso para carregamento de dados de edição
 * const loadOpcaoForEdit = async (opcaoId) => {
 *   const result = await getAprOpcaoResposta({ id: opcaoId });
 *
 *   if (result.success && result.data) {
 *     setFormData({
 *       id: result.data.id,
 *       nome: result.data.nome,
 *       geraPendencia: result.data.geraPendencia
 *     });
 *     setEditMode(true);
 *   } else if (result.success && !result.data) {
 *     message.warning('Opção de resposta não encontrada');
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso para validação de existência
 * const validateOpcaoExists = async (opcaoId) => {
 *   const result = await getAprOpcaoResposta({ id: opcaoId });
 *   return result.success && result.data !== null;
 * };
 *
 * // Uso em modal de detalhes
 * const showOpcaoDetails = async (opcaoId) => {
 *   setLoading(true);
 *
 *   const result = await getAprOpcaoResposta({ id: opcaoId });
 *
 *   if (result.success && result.data) {
 *     setSelectedOpcao(result.data);
 *     setModalVisible(true);
 *   } else {
 *     message.error('Não foi possível carregar os detalhes');
 *   }
 *
 *   setLoading(false);
 * };
 *
 * // Uso com React Query para cache
 * const { data: opcao, isLoading, error } = useQuery({
 *   queryKey: ['apr-opcao-resposta', opcaoId],
 *   queryFn: () => getAprOpcaoResposta({ id: opcaoId }),
 *   enabled: !!opcaoId
 * });
 * ```
 */
export const getAprOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    getAprOpcaoRespostaSchema,

    // Lógica de negócio
    async (validatedData, _session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprOpcaoRespostaService>(
        'aprOpcaoRespostaService'
      );

      // Executa busca por ID
      return service.getById(validatedData.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprOpcaoResposta',
      actionType: 'get',
    }
  );
