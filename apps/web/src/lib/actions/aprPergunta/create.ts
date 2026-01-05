/**
 * Server Action para Criação de APR Pergunta
 *
 * Esta Server Action implementa a criação de novas perguntas APR
 * com validação automática, tratamento de erros e logging completo.
 *
 * FUNCIONALIDADES:
 * - Validação de entrada via Zod schema
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (createdBy)
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe dados brutos do frontend
 * 2. Valida dados usando aprPerguntaCreateSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprPerguntaService.create()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await createAprPergunta({
 *   nome: "Você verificou os EPIs?"
 * });
 *
 * if (result.success) {
 *   console.log('Pergunta criada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprPerguntaService } from '@/lib/services/apr/AprPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprPerguntaCreateSchema } from '../../schemas/aprPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para criar nova pergunta APR
 *
 * Processa a criação de uma nova pergunta APR com validação
 * completa e integração automática com o sistema de auditoria.
 *
 * @param rawData - Dados brutos enviados pelo frontend
 * @returns Promise<ActionResult<AprPergunta>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em componente React
 * const handleSubmit = async (formData) => {
 *   const result = await createAprPergunta({
 *     nome: formData.nome
 *   });
 *
 *   if (result.success) {
 *     message.success('Pergunta criada com sucesso!');
 *     // Atualizar lista ou fechar modal
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 * ```
 */
export const createAprPergunta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod
    aprPerguntaCreateSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprPerguntaService>('aprPerguntaService');

      // Executa criação com ID do usuário autenticado
      return service.create(validatedData, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprPergunta',
      actionType: 'create',
    }
  );
