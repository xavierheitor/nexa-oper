'use server';

import type { ChecklistService } from '@/lib/services/checklist/ChecklistService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireChecklistModelosPermission } from '../common/permissionGuard';

const schema = z.object({ id: z.number().int().positive() });

export const getChecklist = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      requireChecklistModelosPermission(session);
      const service = container.get<ChecklistService>('checklistService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'Checklist', actionType: 'get' }
  );

