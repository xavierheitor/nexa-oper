/**
 * Server Action para aprovar justificativa de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { requireAttendancePermission } from '../common/permissionGuard';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/justificativas/JustificativaEquipeService';
import { aprovarJustificativaEquipeSchema } from '../../schemas/justificativaEquipeSchema';

/**
 * Aprova uma justificativa de equipe
 * Se o tipo não gera falta, remove faltas pendentes automaticamente
 */
export const aprovarJustificativaEquipe = async (rawData: unknown) =>
  handleServerAction(
    aprovarJustificativaEquipeSchema,
    async (data, session) => {
      requireAttendancePermission(session);
      const service = container.get<JustificativaEquipeService>('justificativaEquipeService');
      return service.aprovar(data.id, session.user.id);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'aprovar' }
  );

