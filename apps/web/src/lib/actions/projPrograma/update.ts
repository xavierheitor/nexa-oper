'use server';

import type { ProjProgramaService } from '@/lib/services/projetos/ProjProgramaService';
import { container } from '@/lib/services/common/registerServices';
import { projProgramaUpdateSchema } from '../../schemas/projProgramaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const updateProjPrograma = async (rawData: unknown) =>
  handleServerAction(
    projProgramaUpdateSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProgramaService>('projProgramaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjPrograma', actionType: 'update' }
  );
