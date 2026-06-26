'use server';

import type { ProjProgramaService } from '@/lib/services/projetos/ProjProgramaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosProgramasPermission } from '../common/permissionGuard';

const deleteProjProgramaSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjPrograma = async (rawData: unknown) =>
  handleServerAction(
    deleteProjProgramaSchema,
    async (data, session) => {
      requireProjetosProgramasPermission(session);
      const service = container.get<ProjProgramaService>('projProgramaService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjPrograma', actionType: 'delete' }
  );
