'use server';

import type { ChecklistService } from '@/lib/services/ChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { checklistUpdateSchema } from '../../schemas/checklistSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateChecklist = async (rawData: unknown) =>
  handleServerAction(
    checklistUpdateSchema,
    async (data, session) => {
      const service = container.get<ChecklistService>('checklistService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Checklist', actionType: 'update' }
  );

