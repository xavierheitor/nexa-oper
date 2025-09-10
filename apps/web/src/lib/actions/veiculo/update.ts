/**
 * Server Action para Atualização de Veículos
 *
 * Esta action implementa a atualização de veículos existentes
 * com validação completa e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (incluindo ID obrigatório)
 * - Autenticação obrigatória
 * - Auditoria automática (updatedBy, updatedAt)
 * - Atualização parcial (apenas campos enviados)
 * - Conversão automática de relacionamentos
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await updateVeiculo({
 *   id: 1,
 *   placa: 'XYZ9876', // Apenas campos que mudaram
 *   modelo: 'Corolla'
 *   // tipoVeiculoId e contratoId opcionais
 * });
 *
 * if (result.success) {
 *   console.log('Veículo atualizado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { VeiculoService } from '@/lib/services/VeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { veiculoUpdateSchema } from '../../schemas/veiculoSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um veículo existente
 *
 * @param rawData - Dados do veículo incluindo ID obrigatório e campos a atualizar
 * @returns Resultado da operação com o veículo atualizado
 */
export const updateVeiculo = async (rawData: unknown) =>
  handleServerAction(
    veiculoUpdateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<VeiculoService>('veiculoService');

      // Atualiza o veículo com auditoria automática
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'update' }
  );
