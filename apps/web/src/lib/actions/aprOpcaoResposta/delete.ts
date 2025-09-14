/**
 * Server Action para Exclusão de APR Opção de Resposta
 *
 * Esta Server Action implementa a exclusão lógica (soft delete) de opções de resposta APR
 * com validação, auditoria completa e preservação de dados históricos.
 *
 * FUNCIONALIDADES:
 * - Soft delete (não remove fisicamente do banco)
 * - Validação de ID da opção de resposta
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
 * 1. Recebe ID da opção de resposta a ser excluída
 * 2. Valida ID usando schema apropriado
 * 3. Verifica autenticação do usuário
 * 4. Chama AprOpcaoRespostaService.delete()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await deleteAprOpcaoResposta({ id: 1 });
 * 
 * if (result.success) {
 *   console.log('Opção de resposta excluída:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprOpcaoRespostaService } from '@/lib/services/AprOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

/**
 * Schema de validação para exclusão de opção de resposta APR
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const deleteAprOpcaoRespostaSchema = z.object({
  /** ID único da opção de resposta a ser excluída (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para excluir opção de resposta APR (soft delete)
 *
 * Processa a exclusão lógica de uma opção de resposta APR, mantendo
 * os dados no banco para auditoria e histórico.
 *
 * @param rawData - Dados brutos contendo ID da opção de resposta
 * @returns Promise<ActionResult<AprOpcaoResposta>> - Resultado padronizado
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se a opção de resposta não for encontrada
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em botão de exclusão
 * const handleDelete = async (opcaoId) => {
 *   const confirmed = await confirm('Deseja excluir esta opção de resposta?');
 *   if (!confirmed) return;
 *   
 *   const result = await deleteAprOpcaoResposta({ id: opcaoId });
 *   
 *   if (result.success) {
 *     message.success('Opção de resposta excluída com sucesso!');
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 * 
 * // Uso em operação batch
 * const deleteMultiple = async (opcaoIds) => {
 *   const results = await Promise.allSettled(
 *     opcaoIds.map(id => deleteAprOpcaoResposta({ id }))
 *   );
 *   
 *   const successful = results.filter(r => 
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *   
 *   message.info(`${successful} opções de resposta excluídas`);
 * };
 * 
 * // Uso em componente de tabela
 * const columns = [
 *   // ... outras colunas
 *   {
 *     title: 'Ações',
 *     render: (_, opcao) => (
 *       <Button 
 *         danger 
 *         onClick={() => handleDelete(opcao.id)}
 *       >
 *         Excluir
 *       </Button>
 *     )
 *   }
 * ];
 * ```
 */
export const deleteAprOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    deleteAprOpcaoRespostaSchema,
    
    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprOpcaoRespostaService>('aprOpcaoRespostaService');
      
      // Executa soft delete com ID do usuário autenticado
      return service.delete(validatedData.id, session.user.id);
    },
    
    // Dados brutos para validação
    rawData,
    
    // Metadados para logging e auditoria
    { 
      entityName: 'AprOpcaoResposta', 
      actionType: 'delete' 
    }
  );
