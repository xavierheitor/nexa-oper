/**
 * Server Action para Listagem de Tipos de Equipe
 *
 * Esta action implementa a listagem paginada de tipos de equipe
 * com suporte a filtros, ordenação, busca e includes dinâmicos.
 *
 * FUNCIONALIDADES:
 * - Paginação automática
 * - Ordenação por qualquer campo
 * - Busca textual por nome
 * - Includes dinâmicos (ex: contagem de equipes)
 * - Filtros personalizados
 * - Soft delete (não retorna excluídos)
 *
 * COMO USAR:
 * ```typescript
 * const result = await listTiposEquipe({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   search: 'Linha Viva',
 *   include: {
 *     _count: { select: { Equipe: true } }
 *   }
 * });
 *
 * console.log('Tipos:', result.data.data);
 * console.log('Total:', result.data.total);
 * ```
 */

'use server';

import type { TipoEquipeService } from '@/lib/services/infraestrutura/TipoEquipeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoEquipeFilterSchema } from '../../schemas/tipoEquipeSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista tipos de equipe com paginação e filtros
 *
 * @param rawData - Parâmetros de paginação, filtros e includes
 * @returns Resultado paginado com array de tipos e metadados
 */
export const listTiposEquipe = async (rawData: unknown) =>
  handleServerAction(
    tipoEquipeFilterSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<TipoEquipeService>('tipoEquipeService');

      // Lista tipos com paginação e includes dinâmicos
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoEquipe', actionType: 'list' }
  );

