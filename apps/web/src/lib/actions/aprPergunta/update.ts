/**
 * Server Action para Atualização de APR Pergunta
 *
 * Esta Server Action implementa a atualização de perguntas APR existentes
 * com validação automática, controle de versão e auditoria completa.
 *
 * FUNCIONALIDADES:
 * - Validação de entrada via Zod schema
 * - Verificação de existência da pergunta
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (updatedBy, updatedAt)
 *
 * CAMPOS ATUALIZÁVEIS:
 * - nome: Texto da pergunta APR
 * - Campos de auditoria são atualizados automaticamente
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe dados brutos incluindo ID
 * 2. Valida dados usando aprPerguntaUpdateSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprPerguntaService.update()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await updateAprPergunta({
 *   id: 1,
 *   nome: "Você verificou todos os EPIs necessários?"
 * });
 *
 * if (result.success) {
 *   console.log('Pergunta atualizada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprPerguntaService } from '@/lib/services/apr/AprPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprPerguntaUpdateSchema } from '../../schemas/aprPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para atualizar pergunta APR existente
 *
 * Processa a atualização de uma pergunta APR com validação
 * completa e integração automática com o sistema de auditoria.
 *
 * @param rawData - Dados brutos incluindo ID e campos a atualizar
 * @returns Promise<ActionResult<AprPergunta>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se a pergunta não for encontrada
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em componente de edição
 * const handleUpdate = async (formData) => {
 *   const result = await updateAprPergunta({
 *     id: editingPergunta.id,
 *     nome: formData.nome
 *   });
 *
 *   if (result.success) {
 *     message.success('Pergunta atualizada com sucesso!');
 *     closeModal();
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso em operação batch
 * const updateMultiple = async (perguntas) => {
 *   const results = await Promise.allSettled(
 *     perguntas.map(p => updateAprPergunta(p))
 *   );
 *
 *   const successful = results.filter(r =>
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *
 *   message.info(`${successful} perguntas atualizadas`);
 * };
 * ```
 */
export const updateAprPergunta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod (inclui ID obrigatório)
    aprPerguntaUpdateSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprPerguntaService>('aprPerguntaService');

      // Executa atualização com ID do usuário autenticado
      return service.update(validatedData, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprPergunta',
      actionType: 'update',
    }
  );
