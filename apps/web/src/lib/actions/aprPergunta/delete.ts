/**
 * Server Action para Exclusão de APR Pergunta
 *
 * Esta Server Action implementa a exclusão lógica (soft delete) de perguntas APR
 * com validação, auditoria completa e preservação de dados históricos.
 *
 * FUNCIONALIDADES:
 * - Soft delete (não remove fisicamente do banco)
 * - Validação de ID da pergunta
 * - Verificação de existência antes da exclusão
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (deletedBy, deletedAt)
 *
 * COMPORTAMENTO:
 * - Marca registro como deletado (deletedAt = timestamp)
 * - Registra usuário responsável (deletedBy = user.id)
 * - Preserva dados para auditoria e histórico
 * - Exclui da listagem mas mantém referências
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe ID da pergunta a ser excluída
 * 2. Valida ID usando schema apropriado
 * 3. Verifica autenticação do usuário
 * 4. Chama AprPerguntaService.delete()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await deleteAprPergunta({ id: 1 });
 *
 * if (result.success) {
 *   console.log('Pergunta excluída:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprPerguntaService } from '@/lib/services/apr/AprPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

/**
 * Schema de validação para exclusão de pergunta APR
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const deleteAprPerguntaSchema = z.object({
  /** ID único da pergunta a ser excluída (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para excluir pergunta APR (soft delete)
 *
 * Processa a exclusão lógica de uma pergunta APR, mantendo
 * os dados no banco para auditoria e histórico.
 *
 * @param rawData - Dados brutos contendo ID da pergunta
 * @returns Promise<ActionResult<AprPergunta>> - Resultado padronizado
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se a pergunta não for encontrada
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em botão de exclusão
 * const handleDelete = async (perguntaId) => {
 *   const confirmed = await confirm('Deseja excluir esta pergunta?');
 *   if (!confirmed) return;
 *
 *   const result = await deleteAprPergunta({ id: perguntaId });
 *
 *   if (result.success) {
 *     message.success('Pergunta excluída com sucesso!');
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso em operação batch
 * const deleteMultiple = async (perguntaIds) => {
 *   const results = await Promise.allSettled(
 *     perguntaIds.map(id => deleteAprPergunta({ id }))
 *   );
 *
 *   const successful = results.filter(r =>
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *
 *   message.info(`${successful} perguntas excluídas`);
 * };
 *
 * // Uso em componente de tabela
 * const columns = [
 *   // ... outras colunas
 *   {
 *     title: 'Ações',
 *     render: (_, pergunta) => (
 *       <Button
 *         danger
 *         onClick={() => handleDelete(pergunta.id)}
 *       >
 *         Excluir
 *       </Button>
 *     )
 *   }
 * ];
 * ```
 */
export const deleteAprPergunta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    deleteAprPerguntaSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprPerguntaService>('aprPerguntaService');

      // Executa soft delete com ID do usuário autenticado
      return service.delete(validatedData.id, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprPergunta',
      actionType: 'delete',
    }
  );
