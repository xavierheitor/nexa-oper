/**
 * Server Action para Busca Individual de APR Pergunta
 *
 * Esta Server Action implementa a busca de uma pergunta APR específica
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
 * - Busca apenas perguntas ativas (deletedAt = null)
 * - Retorna null se não encontrar
 * - Valida ID antes da busca
 * - Registra acesso para auditoria
 *
 * CASOS DE USO:
 * - Carregar dados para edição
 * - Exibir detalhes de uma pergunta
 * - Validar existência antes de operações
 * - Carregar dados para formulários
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await getAprPergunta({ id: 1 });
 * 
 * if (result.success && result.data) {
 *   console.log('Pergunta encontrada:', result.data);
 * } else if (result.success && !result.data) {
 *   console.log('Pergunta não encontrada');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprPerguntaService } from '@/lib/services/AprPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

/**
 * Schema de validação para busca de pergunta APR por ID
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const getAprPerguntaSchema = z.object({
  /** ID único da pergunta a ser buscada (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para buscar pergunta APR por ID
 *
 * Processa a busca individual de uma pergunta APR específica,
 * retornando apenas registros ativos (não deletados).
 *
 * @param rawData - Dados brutos contendo ID da pergunta
 * @returns Promise<ActionResult<AprPergunta | null>> - Pergunta encontrada ou null
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso para carregamento de dados de edição
 * const loadPerguntaForEdit = async (perguntaId) => {
 *   const result = await getAprPergunta({ id: perguntaId });
 *   
 *   if (result.success && result.data) {
 *     setFormData({
 *       id: result.data.id,
 *       nome: result.data.nome
 *     });
 *     setEditMode(true);
 *   } else if (result.success && !result.data) {
 *     message.warning('Pergunta não encontrada');
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 * 
 * // Uso para validação de existência
 * const validatePerguntaExists = async (perguntaId) => {
 *   const result = await getAprPergunta({ id: perguntaId });
 *   return result.success && result.data !== null;
 * };
 * 
 * // Uso em modal de detalhes
 * const showPerguntaDetails = async (perguntaId) => {
 *   setLoading(true);
 *   
 *   const result = await getAprPergunta({ id: perguntaId });
 *   
 *   if (result.success && result.data) {
 *     setSelectedPergunta(result.data);
 *     setModalVisible(true);
 *   } else {
 *     message.error('Não foi possível carregar os detalhes');
 *   }
 *   
 *   setLoading(false);
 * };
 * 
 * // Uso com React Query para cache
 * const { data: pergunta, isLoading, error } = useQuery({
 *   queryKey: ['apr-pergunta', perguntaId],
 *   queryFn: () => getAprPergunta({ id: perguntaId }),
 *   enabled: !!perguntaId
 * });
 * ```
 */
export const getAprPergunta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    getAprPerguntaSchema,
    
    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprPerguntaService>('aprPerguntaService');
      
      // Executa busca por ID
      return service.getById(validatedData.id);
    },
    
    // Dados brutos para validação
    rawData,
    
    // Metadados para logging e auditoria
    { 
      entityName: 'AprPergunta', 
      actionType: 'get' 
    }
  );
