/**
 * Server Action para Exclusão de Veículos
 *
 * Esta action implementa a exclusão lógica (soft delete) de veículos
 * com auditoria completa e validação de permissões.
 *
 * FUNCIONALIDADES:
 * - Soft delete (marca como excluído sem remover do banco)
 * - Validação do ID do veículo
 * - Autenticação obrigatória
 * - Auditoria automática (deletedBy, deletedAt)
 * - Preserva histórico para auditoria
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await deleteVeiculo({
 *   id: 1
 * });
 *
 * if (result.success) {
 *   console.log('Veículo excluído:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { VeiculoService } from '@/lib/services/VeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID do veículo a ser excluído
const deleteVeiculoSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Exclui um veículo (soft delete)
 *
 * @param rawData - Objeto contendo o ID do veículo a ser excluído
 * @returns Resultado da operação com o veículo marcado como excluído
 */
export const deleteVeiculo = async (rawData: unknown) =>
  handleServerAction(
    deleteVeiculoSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<VeiculoService>('veiculoService');

      // Realiza soft delete com auditoria automática
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'delete' }
  );
