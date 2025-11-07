/**
 * Server Action para aprovar justificativa de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/JustificativaEquipeService';
import { aprovarJustificativaEquipeSchema } from '../../schemas/justificativaEquipeSchema';

/**
 * Aprova uma justificativa de equipe
 * Se o tipo não gera falta, remove faltas pendentes automaticamente
 */
export const aprovarJustificativaEquipe = async (rawData: unknown) =>
  handleServerAction(
    aprovarJustificativaEquipeSchema,
    async (data, session) => {
      const service = container.get<JustificativaEquipeService>('justificativaEquipeService');
      return service.aprovar(data.id, session.user.id);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'aprovar' }
  );

