'use server';

import type { ProjProjetoService } from '@/lib/services/projetos/ProjProjetoService';
import { container } from '@/lib/services/common/registerServices';
import { projProjetoCreateSchema } from '../../schemas/projProjetoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const createProjProjeto = async (rawData: unknown) =>
  handleServerAction(
    projProjetoCreateSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProjetoService>('projProjetoService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjProjeto', actionType: 'create' }
  );
