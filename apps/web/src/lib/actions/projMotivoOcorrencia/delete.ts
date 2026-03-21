'use server';

import type { ProjMotivoOcorrenciaService } from '@/lib/services/projetos/ProjMotivoOcorrenciaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMotivosOcorrenciaPermission } from '../common/permissionGuard';

const deleteProjMotivoOcorrenciaSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjMotivoOcorrencia = async (rawData: unknown) =>
  handleServerAction(
    deleteProjMotivoOcorrenciaSchema,
    async (data, session) => {
      requireProjetosMotivosOcorrenciaPermission(session);
      const service = container.get<ProjMotivoOcorrenciaService>(
        'projMotivoOcorrenciaService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjMotivoOcorrencia', actionType: 'delete' }
  );
