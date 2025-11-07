/**
 * Server Action para buscar justificativa de equipe por ID
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/JustificativaEquipeService';
import { getJustificativaEquipeByIdSchema } from '../../schemas/justificativaEquipeSchema';

/**
 * Busca uma justificativa de equipe por ID
 */
export const getJustificativaEquipeById = async (rawData: unknown) =>
  handleServerAction(
    getJustificativaEquipeByIdSchema,
    async (data) => {
      const service = container.get<JustificativaEquipeService>('justificativaEquipeService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'get' }
  );

