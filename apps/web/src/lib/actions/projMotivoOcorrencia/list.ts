'use server';

import type { ProjMotivoOcorrenciaService } from '@/lib/services/projetos/ProjMotivoOcorrenciaService';
import { container } from '@/lib/services/common/registerServices';
import { projMotivoOcorrenciaFilterSchema } from '../../schemas/projMotivoOcorrenciaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMotivosOcorrenciaPermission } from '../common/permissionGuard';

export const listProjMotivosOcorrencia = async (rawData: unknown) =>
  handleServerAction(
    projMotivoOcorrenciaFilterSchema,
    async (data, session) => {
      requireProjetosMotivosOcorrenciaPermission(session);
      const service = container.get<ProjMotivoOcorrenciaService>(
        'projMotivoOcorrenciaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjMotivoOcorrencia', actionType: 'list' }
  );
