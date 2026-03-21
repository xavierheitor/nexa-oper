'use server';

import type { ProjMotivoOcorrenciaService } from '@/lib/services/projetos/ProjMotivoOcorrenciaService';
import { container } from '@/lib/services/common/registerServices';
import { projMotivoOcorrenciaUpdateSchema } from '../../schemas/projMotivoOcorrenciaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMotivosOcorrenciaPermission } from '../common/permissionGuard';

export const updateProjMotivoOcorrencia = async (rawData: unknown) =>
  handleServerAction(
    projMotivoOcorrenciaUpdateSchema,
    async (data, session) => {
      requireProjetosMotivosOcorrenciaPermission(session);
      const service = container.get<ProjMotivoOcorrenciaService>(
        'projMotivoOcorrenciaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjMotivoOcorrencia', actionType: 'update' }
  );
