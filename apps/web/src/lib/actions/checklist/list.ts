'use server';

import type { ChecklistService } from '@/lib/services/checklist/ChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { checklistFilterSchema } from '../../schemas/checklistSchema';
import { handleServerAction } from '../common/actionHandler';

export const listChecklists = async (rawData: unknown) =>
  handleServerAction(
    checklistFilterSchema,
    async (data) => {
      const service = container.get<ChecklistService>('checklistService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Checklist', actionType: 'list' }
  );

