// apps/web/src/lib/actions/eletricista/list.ts

/**
 * Server Action para Listagem de Eletricistas
 *
 * Esta action implementa a listagem paginada de eletricistas através
 * de Server Actions do Next.js, incluindo filtros, ordenação,
 * paginação e busca textual.
 */

'use server';

import { eletricistaFilterSchema } from '../../schemas/eletricistaSchema';
import { container } from '../../services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';
import { EletricistaService } from '../../services/pessoas/EletricistaService';

/**
 * Lista eletricistas com paginação e filtros
 *
 * @param rawData - Parâmetros de paginação, filtros e includes
 * @returns Resultado paginado com array de eletricistas e metadados
 */
export const listEletricistas = async (rawData: unknown) =>
  handleServerAction(
    eletricistaFilterSchema,
    async data => {
      const service = container.get<EletricistaService>('eletricistaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'list' }
  );
