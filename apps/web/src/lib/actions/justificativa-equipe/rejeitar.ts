/**
 * Server Action para rejeitar justificativa de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/justificativas/JustificativaEquipeService';
import { rejeitarJustificativaEquipeSchema } from '../../schemas/justificativaEquipeSchema';

/**
 * Rejeita uma justificativa de equipe
 */
export const rejeitarJustificativaEquipe = async (rawData: unknown) =>
  handleServerAction(
    rejeitarJustificativaEquipeSchema,
    async (data, session) => {
      const service = container.get<JustificativaEquipeService>('justificativaEquipeService');
      return service.rejeitar(data.id, session.user.id);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'rejeitar' }
  );

