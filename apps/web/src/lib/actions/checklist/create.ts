'use server';

import type { ChecklistService } from '@/lib/services/checklist/ChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { checklistCreateSchema } from '../../schemas/checklistSchema';
import { handleServerAction } from '../common/actionHandler';

export const createChecklist = async (rawData: unknown) =>
  handleServerAction(
    checklistCreateSchema,
    async (data, session) => {
      const service = container.get<ChecklistService>('checklistService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Checklist', actionType: 'create' }
  );

