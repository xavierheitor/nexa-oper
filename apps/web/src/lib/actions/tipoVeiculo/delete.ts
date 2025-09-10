/**
 * Server Action para Exclusão de Tipos de Veículo
 *
 * Esta action implementa a exclusão lógica (soft delete) de tipos
 * de veículo com auditoria completa e validação de permissões.
 *
 * FUNCIONALIDADES:
 * - Soft delete (marca como excluído sem remover do banco)
 * - Validação do ID do tipo
 * - Autenticação obrigatória
 * - Auditoria automática (deletedBy, deletedAt)
 * - Preserva histórico para auditoria
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await deleteTipoVeiculo({
 *   id: 1
 * });
 *
 * if (result.success) {
 *   console.log('Tipo excluído:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { TipoVeiculoService } from '@/lib/services/TipoVeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID do tipo a ser excluído
const deleteTipoVeiculoSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Exclui um tipo de veículo (soft delete)
 *
 * @param rawData - Objeto contendo o ID do tipo a ser excluído
 * @returns Resultado da operação com o tipo marcado como excluído
 */
export const deleteTipoVeiculo = async (rawData: unknown) =>
  handleServerAction(
    deleteTipoVeiculoSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<TipoVeiculoService>('tipoVeiculoService');

      // Realiza soft delete com auditoria automática
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'TipoVeiculo', actionType: 'delete' }
  );
