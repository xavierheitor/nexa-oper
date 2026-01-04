/**
 * Server Action para Listagem de Bases
 *
 * Esta action implementa a listagem paginada de bases
 * com suporte a filtros, ordenação, busca e includes dinâmicos.
 *
 * FUNCIONALIDADES:
 * - Paginação automática
 * - Ordenação por qualquer campo
 * - Busca textual por nome
 * - Filtro por contrato
 * - Includes dinâmicos (ex: informações do contrato)
 * - Filtros personalizados
 * - Soft delete (não retorna excluídos)
 *
 * COMO USAR:
 * ```typescript
 * const result = await listBases({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   search: 'Aparecida',
 *   contratoId: 1,
 *   include: {
 *     contrato: true
 *   }
 * });
 *
 * console.log('Bases:', result.data.data);
 * console.log('Total:', result.data.total);
 * ```
 */

'use server';

import type { BaseService } from '@/lib/services/infraestrutura/BaseService';
import { container } from '@/lib/services/common/registerServices';
import { baseFilterSchema } from '../../schemas/baseSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista bases com paginação e filtros
 *
 * @param rawData - Parâmetros de paginação, filtros e includes
 * @returns Resultado paginado com array de bases e metadados
 */
export const listBases = async (rawData: unknown) =>
  handleServerAction(
    baseFilterSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<BaseService>('baseService');

      // Lista bases com paginação e includes dinâmicos
      return service.list(data);
    },
    rawData,
    { entityName: 'Base', actionType: 'list' }
  );
