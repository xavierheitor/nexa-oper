'use server';

import type { ProjMotivoOcorrenciaService } from '@/lib/services/projetos/ProjMotivoOcorrenciaService';
import { container } from '@/lib/services/common/registerServices';
import { projMotivoOcorrenciaCreateSchema } from '../../schemas/projMotivoOcorrenciaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMotivosOcorrenciaPermission } from '../common/permissionGuard';

export const createProjMotivoOcorrencia = async (rawData: unknown) =>
  handleServerAction(
    projMotivoOcorrenciaCreateSchema,
    async (data, session) => {
      requireProjetosMotivosOcorrenciaPermission(session);
      const service = container.get<ProjMotivoOcorrenciaService>(
        'projMotivoOcorrenciaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjMotivoOcorrencia', actionType: 'create' }
  );
