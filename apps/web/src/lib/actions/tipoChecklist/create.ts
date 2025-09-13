'use server';

import type { TipoChecklistService } from '@/lib/services/TipoChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { tipoChecklistCreateSchema } from '../../schemas/tipoChecklistSchema';
import { handleServerAction } from '../common/actionHandler';

export const createTipoChecklist = async (rawData: unknown) =>
  handleServerAction(
    tipoChecklistCreateSchema,
    async (data, session) => {
      const service = container.get<TipoChecklistService>('tipoChecklistService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoChecklist', actionType: 'create' }
  );
