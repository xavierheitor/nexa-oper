/**
 * Server Action para Exclusão de Vínculo APR-TipoAtividade
 *
 * Esta Server Action implementa a exclusão lógica (soft delete) de vínculos
 * entre APRs e Tipos de Atividade com validação, auditoria completa
 * e preservação de dados históricos.
 *
 * FUNCIONALIDADES:
 * - Soft delete (não remove fisicamente do banco)
 * - Validação de ID do vínculo
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
 * - Remove vínculo ativo sem afetar outros vínculos
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe ID do vínculo a ser excluído
 * 2. Valida ID usando schema apropriado
 * 3. Verifica autenticação do usuário
 * 4. Chama Repository.delete() para soft delete
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await deleteAprTipoAtividadeVinculo({ id: 1 });
 *
 * if (result.success) {
 *   console.log('Vínculo excluído:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprTipoAtividadeVinculoService } from '@/lib/services/apr/AprTipoAtividadeVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../../common/actionHandler';

/**
 * Schema de validação para exclusão de vínculo APR-TipoAtividade
 *
 * Valida que o ID fornecido é um número inteiro positivo válido.
 */
const deleteAprTipoAtividadeVinculoSchema = z.object({
  /** ID único do vínculo a ser excluído (obrigatório) */
  id: z.number().int().positive('ID deve ser um número positivo'),
});

/**
 * Server Action para excluir vínculo APR-TipoAtividade (soft delete)
 *
 * Processa a exclusão lógica de um vínculo, mantendo
 * os dados no banco para auditoria e histórico.
 *
 * @param rawData - Dados brutos contendo ID do vínculo
 * @returns Promise<ActionResult<AprTipoAtividadeRelacao>> - Resultado padronizado
 *
 * @throws {ValidationError} Se o ID for inválido
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se o vínculo não for encontrado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 *
 * @example
 * ```typescript
 * // Uso em botão de exclusão
 * const handleDelete = async (vinculoId) => {
 *   const confirmed = await confirm('Deseja remover este vínculo?');
 *   if (!confirmed) return;
 *
 *   const result = await deleteAprTipoAtividadeVinculo({ id: vinculoId });
 *
 *   if (result.success) {
 *     message.success('Vínculo removido com sucesso!');
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso em operação batch
 * const deleteMultiple = async (vinculoIds) => {
 *   const results = await Promise.allSettled(
 *     vinculoIds.map(id => deleteAprTipoAtividadeVinculo({ id }))
 *   );
 *
 *   const successful = results.filter(r =>
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *
 *   message.info(`${successful} vínculos removidos`);
 * };
 *
 * // Uso em componente de tabela
 * const columns = [
 *   // ... outras colunas
 *   {
 *     title: 'Ações',
 *     render: (_, vinculo) => (
 *       <Popconfirm
 *         title="Deseja remover este vínculo?"
 *         onConfirm={() => handleDelete(vinculo.id)}
 *       >
 *         <Button danger size="small">Remover</Button>
 *       </Popconfirm>
 *     )
 *   }
 * ];
 *
 * // Uso para desvincular APR de tipo específico
 * const unlinkAprFromTipo = async (tipoAtividadeId) => {
 *   // Primeiro encontra o vínculo ativo
 *   const vinculos = await listAprTipoAtividadeVinculos({
 *     page: 1,
 *     pageSize: 1,
 *     // Filtrar por tipoAtividadeId se necessário
 *   });
 *
 *   if (vinculos.success && vinculos.data.data.length > 0) {
 *     const vinculo = vinculos.data.data[0];
 *     await deleteAprTipoAtividadeVinculo({ id: vinculo.id });
 *   }
 * };
 * ```
 */
export const deleteAprTipoAtividadeVinculo = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação para ID
    deleteAprTipoAtividadeVinculoSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprTipoAtividadeVinculoService>(
        'aprTipoAtividadeVinculoService'
      );

      // Executa soft delete via repository (service não tem delete específico)
      // Usa o repository diretamente para operação de delete
      return (service as any).repo.delete(validatedData.id, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprTipoAtividadeRelacao',
      actionType: 'delete',
    }
  );

