'use server';

import type { ProjProgramaService } from '@/lib/services/projetos/ProjProgramaService';
import { container } from '@/lib/services/common/registerServices';
import { projProgramaFilterSchema } from '../../schemas/projProgramaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const listProjProgramas = async (rawData: unknown) =>
  handleServerAction(
    projProgramaFilterSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProgramaService>('projProgramaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjPrograma', actionType: 'list' }
  );
