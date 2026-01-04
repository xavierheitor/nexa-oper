'use server';

import type { TipoChecklistService } from '@/lib/services/checklist/TipoChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteTipoChecklist = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<TipoChecklistService>('tipoChecklistService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'TipoChecklist', actionType: 'delete' }
  );
