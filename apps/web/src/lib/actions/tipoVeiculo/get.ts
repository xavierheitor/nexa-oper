/**
 * Server Action para Busca de Tipo de Veículo por ID
 *
 * Esta action implementa a busca de um tipo de veículo específico
 * por ID, com validação e tratamento de erros.
 *
 * FUNCIONALIDADES:
 * - Validação do ID do tipo
 * - Busca por ID único
 * - Retorna null se não encontrado
 * - Ignora registros com soft delete
 * - Tratamento de erros
 * - Não requer autenticação (apenas leitura)
 *
 * COMO USAR:
 * ```typescript
 * const result = await getTipoVeiculo({
 *   id: 1
 * });
 *
 * if (result.success && result.data) {
 *   console.log('Tipo encontrado:', result.data);
 * } else {
 *   console.log('Tipo não encontrado');
 * }
 * ```
 */

'use server';

import type { TipoVeiculoService } from '@/lib/services/infraestrutura/TipoVeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID do tipo a ser buscado
const getTipoVeiculoSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Busca um tipo de veículo por ID
 *
 * @param rawData - Objeto contendo o ID do tipo a ser buscado
 * @returns Resultado da operação com o tipo encontrado ou null
 */
export const getTipoVeiculo = async (rawData: unknown) =>
  handleServerAction(
    getTipoVeiculoSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<TipoVeiculoService>('tipoVeiculoService');

      // Busca o tipo por ID (retorna null se não encontrado)
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'TipoVeiculo', actionType: 'get' }
  );
