/**
 * Server Action para Atualização de APR Opção de Resposta
 *
 * Esta Server Action implementa a atualização de opções de resposta APR existentes
 * com validação automática, controle de versão e auditoria completa.
 *
 * FUNCIONALIDADES:
 * - Validação de entrada via Zod schema
 * - Verificação de existência da opção de resposta
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (updatedBy, updatedAt)
 *
 * CAMPOS ATUALIZÁVEIS:
 * - nome: Texto da opção de resposta APR
 * - geraPendencia: Se a opção gera pendência
 * - Campos de auditoria são atualizados automaticamente
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe dados brutos incluindo ID
 * 2. Valida dados usando aprOpcaoRespostaUpdateSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprOpcaoRespostaService.update()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await updateAprOpcaoResposta({
 *   id: 1,
 *   nome: "Parcialmente Conforme",
 *   geraPendencia: false
 * });
 *
 * if (result.success) {
 *   console.log('Opção de resposta atualizada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprOpcaoRespostaService } from '@/lib/services/apr/AprOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { aprOpcaoRespostaUpdateSchema } from '../../schemas/aprOpcaoRespostaSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para atualizar opção de resposta APR existente
 *
 * Processa a atualização de uma opção de resposta APR com validação
 * completa e integração automática com o sistema de auditoria.
 *
 * @param rawData - Dados brutos incluindo ID e campos a atualizar
 * @returns Promise<ActionResult<AprOpcaoResposta>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se a opção de resposta não for encontrada
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em componente de edição
 * const handleUpdate = async (formData) => {
 *   const result = await updateAprOpcaoResposta({
 *     id: editingOpcao.id,
 *     nome: formData.nome,
 *     geraPendencia: formData.geraPendencia
 *   });
 *
 *   if (result.success) {
 *     message.success('Opção de resposta atualizada com sucesso!');
 *     closeModal();
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso em operação batch
 * const updateMultiple = async (opcoes) => {
 *   const results = await Promise.allSettled(
 *     opcoes.map(o => updateAprOpcaoResposta(o))
 *   );
 *
 *   const successful = results.filter(r =>
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *
 *   message.info(`${successful} opções de resposta atualizadas`);
 * };
 * ```
 */
export const updateAprOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod (inclui ID obrigatório)
    aprOpcaoRespostaUpdateSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprOpcaoRespostaService>(
        'aprOpcaoRespostaService'
      );

      // Executa atualização com ID do usuário autenticado
      return service.update(validatedData, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprOpcaoResposta',
      actionType: 'update',
    }
  );
