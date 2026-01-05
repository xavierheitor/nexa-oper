'use server';

import type { TipoChecklistService } from '@/lib/services/checklist/TipoChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { tipoChecklistUpdateSchema } from '../../schemas/tipoChecklistSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateTipoChecklist = async (rawData: unknown) =>
  handleServerAction(
    tipoChecklistUpdateSchema,
    async (data, session) => {
      const service = container.get<TipoChecklistService>('tipoChecklistService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoChecklist', actionType: 'update' }
  );
