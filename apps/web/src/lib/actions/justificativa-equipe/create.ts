/**
 * Server Action para criar justificativa de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/justificativas/JustificativaEquipeService';
import { criarJustificativaEquipeSchema } from '../../schemas/justificativaEquipeSchema';

/**
 * Cria uma justificativa para uma equipe que não abriu turno
 */
export const createJustificativaEquipe = async (rawData: unknown) =>
  handleServerAction(
    criarJustificativaEquipeSchema,
    async (data, session) => {
      const service = container.get<JustificativaEquipeService>('justificativaEquipeService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'create' }
  );

