'use server';

import type { ChecklistService } from '@/lib/services/checklist/ChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { checklistUpdateSchema } from '../../schemas/checklistSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireChecklistModelosPermission } from '../common/permissionGuard';

export const updateChecklist = async (rawData: unknown) =>
  handleServerAction(
    checklistUpdateSchema,
    async (data, session) => {
      requireChecklistModelosPermission(session);
      const service = container.get<ChecklistService>('checklistService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Checklist', actionType: 'update' }
  );

