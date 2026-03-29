'use server';

import type { ProjProgramaService } from '@/lib/services/projetos/ProjProgramaService';
import { container } from '@/lib/services/common/registerServices';
import { projProgramaCreateSchema } from '../../schemas/projProgramaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const createProjPrograma = async (rawData: unknown) =>
  handleServerAction(
    projProgramaCreateSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProgramaService>('projProgramaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjPrograma', actionType: 'create' }
  );
