'use server';

import type { TipoChecklistService } from '@/lib/services/checklist/TipoChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { tipoChecklistFilterSchema } from '../../schemas/tipoChecklistSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireTiposChecklistPermission } from '../common/permissionGuard';

export const listTiposChecklist = async (rawData: unknown) =>
  handleServerAction(
    tipoChecklistFilterSchema,
    async (data, session) => {
      requireTiposChecklistPermission(session);
      const service = container.get<TipoChecklistService>('tipoChecklistService');
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoChecklist', actionType: 'list' }
  );
