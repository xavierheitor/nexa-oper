'use server';

import type { ProjProjetoService } from '@/lib/services/projetos/ProjProjetoService';
import { container } from '@/lib/services/common/registerServices';
import { projProjetoUpdateSchema } from '../../schemas/projProjetoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const updateProjProjeto = async (rawData: unknown) =>
  handleServerAction(
    projProjetoUpdateSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProjetoService>('projProjetoService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjProjeto', actionType: 'update' }
  );
