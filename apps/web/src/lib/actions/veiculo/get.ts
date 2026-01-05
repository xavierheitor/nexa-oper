/**
 * Server Action para Busca de Veículo por ID
 *
 * Esta action implementa a busca de um veículo específico
 * por ID, com validação e tratamento de erros.
 *
 * FUNCIONALIDADES:
 * - Validação do ID do veículo
 * - Busca por ID único
 * - Retorna null se não encontrado
 * - Ignora registros com soft delete
 * - Tratamento de erros
 * - Não requer autenticação (apenas leitura)
 *
 * COMO USAR:
 * ```typescript
 * const result = await getVeiculo({
 *   id: 1
 * });
 *
 * if (result.success && result.data) {
 *   console.log('Veículo encontrado:', result.data);
 * } else {
 *   console.log('Veículo não encontrado');
 * }
 * ```
 */

'use server';

import type { VeiculoService } from '@/lib/services/infraestrutura/VeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID do veículo a ser buscado
const getVeiculoSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Busca um veículo por ID
 *
 * @param rawData - Objeto contendo o ID do veículo a ser buscado
 * @returns Resultado da operação com o veículo encontrado ou null
 */
export const getVeiculo = async (rawData: unknown) =>
  handleServerAction(
    getVeiculoSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<VeiculoService>('veiculoService');

      // Busca o veículo por ID (retorna null se não encontrado)
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'get' }
  );
