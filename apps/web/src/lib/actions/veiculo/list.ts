/**
 * Server Action para Listagem de Veículos
 *
 * Esta action implementa a listagem paginada de veículos
 * com suporte a filtros, ordenação, busca e includes dinâmicos.
 *
 * FUNCIONALIDADES:
 * - Paginação automática
 * - Ordenação por qualquer campo
 * - Busca textual em placa e modelo
 * - Includes dinâmicos (tipoVeiculo, contrato)
 * - Filtros personalizados
 * - Soft delete (não retorna excluídos)
 *
 * COMO USAR:
 * ```typescript
 * const result = await listVeiculos({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'placa',
 *   orderDir: 'asc',
 *   search: 'ABC',
 *   include: {
 *     tipoVeiculo: true,
 *     contrato: true
 *   }
 * });
 *
 * console.log('Veículos:', result.data.data);
 * console.log('Total:', result.data.total);
 * ```
 */

'use server';

import type { VeiculoService } from '@/lib/services/infraestrutura/VeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { veiculoFilterSchema } from '../../schemas/veiculoSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista veículos com paginação e filtros
 *
 * @param rawData - Parâmetros de paginação, filtros e includes
 * @returns Resultado paginado com array de veículos e metadados
 */
export const listVeiculos = async (rawData: unknown) =>
  handleServerAction(
    veiculoFilterSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<VeiculoService>('veiculoService');

      // Lista veículos com paginação e includes dinâmicos
      return service.list(data);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'list' }
  );
