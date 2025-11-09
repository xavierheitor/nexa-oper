/**
 * Server Action para atualizar tipo de justificativa
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/TipoJustificativaService';
import { atualizarTipoJustificativaSchema } from '../../schemas/tipoJustificativaSchema';

/**
 * Atualiza um tipo de justificativa existente
 */
export const updateTipoJustificativa = async (rawData: unknown) =>
  handleServerAction(
    atualizarTipoJustificativaSchema,
    async (data, session) => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoJustificativa', actionType: 'update' }
  );

