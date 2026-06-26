'use server';

import type { ProjProjetoService } from '@/lib/services/projetos/ProjProjetoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

const deleteProjProjetoSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjProjeto = async (rawData: unknown) =>
  handleServerAction(
    deleteProjProjetoSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProjetoService>('projProjetoService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjProjeto', actionType: 'delete' }
  );
