/**
 * Server Action para buscar tipo de justificativa por ID
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { requireTiposJustificativaPermission } from '../common/permissionGuard';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/justificativas/TipoJustificativaService';
import { getTipoJustificativaByIdSchema } from '../../schemas/tipoJustificativaSchema';

/**
 * Busca um tipo de justificativa por ID
 */
export const getTipoJustificativaById = async (rawData: unknown) =>
  handleServerAction(
    getTipoJustificativaByIdSchema,
    async (data, session) => {
      requireTiposJustificativaPermission(session);
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'TipoJustificativa', actionType: 'get' }
  );

