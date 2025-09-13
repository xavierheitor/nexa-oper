'use server';

import type { TipoChecklistService } from '@/lib/services/TipoChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { tipoChecklistFilterSchema } from '../../schemas/tipoChecklistSchema';
import { handleServerAction } from '../common/actionHandler';

export const listTiposChecklist = async (rawData: unknown) =>
  handleServerAction(
    tipoChecklistFilterSchema,
    async (data) => {
      const service = container.get<TipoChecklistService>('tipoChecklistService');
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoChecklist', actionType: 'list' }
  );
