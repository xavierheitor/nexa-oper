/**
 * Server Action para desativar tipo de justificativa
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/TipoJustificativaService';
import { z } from 'zod';

const deleteTipoJustificativaSchema = z.object({
  id: z.number().int().positive({ message: 'ID do tipo é obrigatório' }),
});

/**
 * Desativa um tipo de justificativa (soft delete)
 */
export const deleteTipoJustificativa = async (rawData: unknown) =>
  handleServerAction(
    deleteTipoJustificativaSchema,
    async (data, session) => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'TipoJustificativa', actionType: 'delete' }
  );

