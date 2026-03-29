'use server';

import type { ProjProjetoService } from '@/lib/services/projetos/ProjProjetoService';
import { container } from '@/lib/services/common/registerServices';
import { projProjetoFilterSchema } from '../../schemas/projProjetoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const listProjProjetos = async (rawData: unknown) =>
  handleServerAction(
    projProjetoFilterSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjProjetoService>('projProjetoService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjProjeto', actionType: 'list' }
  );
