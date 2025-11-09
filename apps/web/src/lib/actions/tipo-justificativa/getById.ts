/**
 * Server Action para buscar tipo de justificativa por ID
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/TipoJustificativaService';
import { getTipoJustificativaByIdSchema } from '../../schemas/tipoJustificativaSchema';

/**
 * Busca um tipo de justificativa por ID
 */
export const getTipoJustificativaById = async (rawData: unknown) =>
  handleServerAction(
    getTipoJustificativaByIdSchema,
    async (data) => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'TipoJustificativa', actionType: 'get' }
  );

