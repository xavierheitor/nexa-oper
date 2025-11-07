/**
 * Server Action para listar justificativas de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/JustificativaEquipeService';
import { listarJustificativasEquipeSchema } from '../../schemas/justificativaEquipeSchema';

/**
 * Lista justificativas de equipe com filtros e paginação
 */
export const listJustificativasEquipe = async (rawData: unknown) =>
  handleServerAction(
    listarJustificativasEquipeSchema,
    async (data) => {
      const service = container.get<JustificativaEquipeService>('justificativaEquipeService');
      return service.list(data);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'list' }
  );

