'use server';

import type { ChecklistService } from '@/lib/services/ChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteChecklist = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<ChecklistService>('checklistService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Checklist', actionType: 'delete' }
  );

