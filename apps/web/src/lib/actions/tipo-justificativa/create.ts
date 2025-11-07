/**
 * Server Action para criar tipo de justificativa
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/TipoJustificativaService';
import { criarTipoJustificativaSchema } from '../../schemas/tipoJustificativaSchema';

/**
 * Cria um novo tipo de justificativa
 */
export const createTipoJustificativa = async (rawData: unknown) =>
  handleServerAction(
    criarTipoJustificativaSchema,
    async (data, session) => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoJustificativa', actionType: 'create' }
  );

