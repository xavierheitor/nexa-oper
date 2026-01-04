/**
 * Server Action para criar justificativa de falta
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaService } from '../../services/justificativas/JustificativaService';
import { criarJustificativaSchema } from '../../schemas/justificativaSchema';

/**
 * Cria uma justificativa para uma falta
 */
export const criarJustificativa = async (rawData: unknown) =>
  handleServerAction(
    criarJustificativaSchema,
    async (data, session) => {
      const service = container.get<JustificativaService>('justificativaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Justificativa', actionType: 'create' }
  );

