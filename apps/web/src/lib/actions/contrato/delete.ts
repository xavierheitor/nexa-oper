/**
 * Server Action para Exclusão de Contratos (Soft Delete)
 *
 * Esta action implementa a exclusão lógica (soft delete) de contratos
 * através de Server Actions do Next.js, mantendo o registro no banco
 * com campos de auditoria para rastreabilidade.
 *
 * FUNCIONALIDADES:
 * - Validação de ID numérico positivo
 * - Autenticação obrigatória
 * - Soft delete (exclusão lógica)
 * - Auditoria automática (deletedBy, deletedAt)
 * - Verificação de existência do contrato
 * - Logging automático da operação
 * - Tratamento de erros padronizado
 * - Preservação de dados para auditoria
 *
 * COMO FUNCIONA:
 * 1. Valida se o ID é um número inteiro positivo
 * 2. Verifica autenticação do usuário
 * 3. Adiciona campos de auditoria automaticamente
 * 4. Verifica se o contrato existe e não foi excluído
 * 5. Marca o contrato como excluído (deletedAt, deletedBy)
 * 6. Retorna o contrato marcado como excluído
 * 7. Registra a operação nos logs
 *
 * SOFT DELETE vs HARD DELETE:
 * - Soft Delete: Marca registro como excluído (deletedAt não nulo)
 * - Hard Delete: Remove fisicamente do banco (não recomendado)
 * - Benefícios: Auditoria, recuperação, integridade referencial
 *
 * CAMPOS AUTOMÁTICOS (adicionados pela action):
 * - deletedBy: ID do usuário que fez a exclusão
 * - deletedAt: Timestamp da exclusão
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Excluir contrato
 * const result = await deleteContrato({ id: 123 });
 *
 * if (result.success) {
 *   console.log('Contrato excluído:', result.data);
 *   toast.success('Contrato excluído com sucesso!');
 * } else {
 *   console.error('Erro na exclusão:', result.error);
 *   toast.error(result.error);
 * }
 *
 * // Uso com confirmação em componente React
 * const handleDeleteContrato = async (id: number) => {
 *   const confirmed = window.confirm(
 *     'Tem certeza que deseja excluir este contrato?'
 *   );
 *
 *   if (confirmed) {
 *     const result = await deleteContrato({ id });
 *
 *     if (result.success) {
 *       toast.success('Contrato excluído com sucesso!');
 *       // Recarregar lista
 *       loadContratos();
 *     } else {
 *       toast.error(result.error);
 *     }
 *   }
 * };
 *
 * // Uso em TableActionButtons
 * <TableActionButtons
 *   record={contrato}
 *   onDelete={(contrato) => handleDeleteContrato(contrato.id)}
 *   customActions={[
 *     {
 *       key: 'restore',
 *       label: 'Restaurar',
 *       type: 'link',
 *       confirm: {
 *         title: 'Restaurar Contrato',
 *         description: 'Deseja restaurar este contrato?'
 *       },
 *       onClick: (contrato) => restoreContrato(contrato.id)
 *     }
 *   ]}
 * />
 * ```
 */

'use server';

import type { ContratoService } from '@/lib/services/ContratoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema de validação para ID do contrato
const deleteSchema = z.object({
  id: z.number().int().positive('ID deve ser um número inteiro positivo'),
});

/**
 * Exclui um contrato (soft delete)
 *
 * Marca o contrato como excluído mantendo o registro no banco
 * para auditoria e possível recuperação futura.
 *
 * @param rawData - Dados brutos contendo o ID do contrato
 * @returns Resultado da operação com o contrato marcado como excluído
 */
export const deleteContrato = async (rawData: unknown) =>
  handleServerAction(
    deleteSchema,
    async ({ id }, session) => {
      // Obtém o serviço do container
      const service = container.get<ContratoService>('contratoService');

      // Executa soft delete com auditoria automática
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'Contrato', actionType: 'delete' }
  );
