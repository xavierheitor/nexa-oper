/**
 * Server Action para Atualização de Tipos de Veículo
 *
 * Esta action implementa a atualização de tipos de veículo existentes
 * com validação completa e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (incluindo ID obrigatório)
 * - Autenticação obrigatória
 * - Auditoria automática (updatedBy, updatedAt)
 * - Atualização parcial (apenas campos enviados)
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await updateTipoVeiculo({
 *   id: 1,
 *   nome: 'Motocicleta' // Apenas campos que mudaram
 * });
 *
 * if (result.success) {
 *   console.log('Tipo atualizado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { TipoVeiculoService } from '@/lib/services/infraestrutura/TipoVeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { tipoVeiculoUpdateSchema } from '../../schemas/tipoVeiculoSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um tipo de veículo existente
 *
 * @param rawData - Dados do tipo incluindo ID obrigatório e campos a atualizar
 * @returns Resultado da operação com o tipo atualizado
 */
export const updateTipoVeiculo = async (rawData: unknown) =>
  handleServerAction(
    tipoVeiculoUpdateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<TipoVeiculoService>('tipoVeiculoService');

      // Atualiza o tipo com auditoria automática
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoVeiculo', actionType: 'update' }
  );
