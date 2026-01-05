/**
 * Server Action para Listagem de Tipos de Veículo
 *
 * Esta action implementa a listagem paginada de tipos de veículo
 * com suporte a filtros, ordenação, busca e includes dinâmicos.
 *
 * FUNCIONALIDADES:
 * - Paginação automática
 * - Ordenação por qualquer campo
 * - Busca textual por nome
 * - Includes dinâmicos (ex: contagem de veículos)
 * - Filtros personalizados
 * - Soft delete (não retorna excluídos)
 *
 * COMO USAR:
 * ```typescript
 * const result = await listTiposVeiculo({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   search: 'Carro',
 *   include: {
 *     _count: { select: { veiculos: true } }
 *   }
 * });
 *
 * console.log('Tipos:', result.data.data);
 * console.log('Total:', result.data.total);
 * ```
 */

'use server';

import type { TipoVeiculoService } from '@/lib/services/infraestrutura/TipoVeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { tipoVeiculoFilterSchema } from '../../schemas/tipoVeiculoSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista tipos de veículo com paginação e filtros
 *
 * @param rawData - Parâmetros de paginação, filtros e includes
 * @returns Resultado paginado com array de tipos e metadados
 */
export const listTiposVeiculo = async (rawData: unknown) =>
  handleServerAction(
    tipoVeiculoFilterSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<TipoVeiculoService>('tipoVeiculoService');

      // Lista tipos com paginação e includes dinâmicos
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoVeiculo', actionType: 'list' }
  );
