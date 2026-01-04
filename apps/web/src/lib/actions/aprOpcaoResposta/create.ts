/**
 * Server Action para Criação de APR Opção de Resposta
 *
 * Esta Server Action implementa a criação de novas opções de resposta APR
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
 * 2. Valida dados usando aprOpcaoRespostaCreateSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprOpcaoRespostaService.create()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await createAprOpcaoResposta({
 *   nome: "Não Conforme",
 *   geraPendencia: true
 * });
 *
 * if (result.success) {
 *   console.log('Opção de resposta criada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprOpcaoRespostaService } from '@/lib/services/apr/AprOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { aprOpcaoRespostaCreateSchema } from '../../schemas/aprOpcaoRespostaSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para criar nova opção de resposta APR
 *
 * Processa a criação de uma nova opção de resposta APR com validação
 * completa e integração automática com o sistema de auditoria.
 *
 * @param rawData - Dados brutos enviados pelo frontend
 * @returns Promise<ActionResult<AprOpcaoResposta>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em componente React
 * const handleSubmit = async (formData) => {
 *   const result = await createAprOpcaoResposta({
 *     nome: formData.nome,
 *     geraPendencia: formData.geraPendencia
 *   });
 *
 *   if (result.success) {
 *     message.success('Opção de resposta criada com sucesso!');
 *     // Atualizar lista ou fechar modal
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 * ```
 */
export const createAprOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod
    aprOpcaoRespostaCreateSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprOpcaoRespostaService>(
        'aprOpcaoRespostaService'
      );

      // Executa criação com ID do usuário autenticado
      return service.create(validatedData, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprOpcaoResposta',
      actionType: 'create',
    }
  );
