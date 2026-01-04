/**
 * Server Action para Exclusão de APR
 *
 * Esta Server Action implementa a exclusão lógica (soft delete) de APRs
 * com validação, auditoria completa e preservação de dados históricos.
 *
 * FUNCIONALIDADES:
 * - Soft delete (não remove fisicamente do banco)
 * - Validação de ID da APR
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
 * - Relacionamentos são preservados para auditoria
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe ID da APR a ser excluída
 * 2. Valida ID usando schema apropriado
 * 3. Verifica autenticação do usuário
 * 4. Chama AprService.delete()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await deleteApr({ id: 1 });
 *
 * if (result.success) {
 *   console.log('APR excluída:', result.data);
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
 * Schema de validação para exclusão de APR
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const deleteAprSchema = z.object({
  /** ID único da APR a ser excluída (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para excluir APR (soft delete)
 *
 * Processa a exclusão lógica de uma APR, mantendo
 * os dados no banco para auditoria e histórico.
 *
 * @param rawData - Dados brutos contendo ID da APR
 * @returns Promise<ActionResult<Apr>> - Resultado padronizado
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se a APR não for encontrada
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em botão de exclusão
 * const handleDelete = async (aprId) => {
 *   const confirmed = await confirm('Deseja excluir esta APR?');
 *   if (!confirmed) return;
 *
 *   const result = await deleteApr({ id: aprId });
 *
 *   if (result.success) {
 *     message.success('APR excluída com sucesso!');
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso em operação batch
 * const deleteMultiple = async (aprIds) => {
 *   const results = await Promise.allSettled(
 *     aprIds.map(id => deleteApr({ id }))
 *   );
 *
 *   const successful = results.filter(r =>
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *
 *   message.info(`${successful} APRs excluídas`);
 * };
 *
 * // Uso em componente de tabela
 * const columns = [
 *   // ... outras colunas
 *   {
 *     title: 'Ações',
 *     render: (_, apr) => (
 *       <Popconfirm
 *         title="Deseja excluir esta APR?"
 *         onConfirm={() => handleDelete(apr.id)}
 *       >
 *         <Button danger>Excluir</Button>
 *       </Popconfirm>
 *     )
 *   }
 * ];
 *
 * // Uso com verificação de relacionamentos
 * const safeDelete = async (aprId) => {
 *   // Verificar se APR tem relacionamentos ativos
 *   const apr = await getApr({
 *     id: aprId,
 *     include: {
 *       AprPerguntaRelacao: true,
 *       AprOpcaoRespostaRelacao: true
 *     }
 *   });
 *
 *   if (apr.success && apr.data) {
 *     const hasRelations =
 *       apr.data.AprPerguntaRelacao?.length > 0 ||
 *       apr.data.AprOpcaoRespostaRelacao?.length > 0;
 *
 *     if (hasRelations) {
 *       const confirmed = await confirm(
 *         'Esta APR possui vínculos. Deseja excluir mesmo assim?'
 *       );
 *       if (!confirmed) return;
 *     }
 *   }
 *
 *   await deleteApr({ id: aprId });
 * };
 * ```
 */
export const deleteApr = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    deleteAprSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprService>('aprService');

      // Executa soft delete com ID do usuário autenticado
      return service.delete(validatedData.id, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'Apr',
      actionType: 'delete',
    }
  );
