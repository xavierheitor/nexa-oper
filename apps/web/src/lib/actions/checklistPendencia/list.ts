'use server';

import type { ChecklistPendenciaService } from '@/lib/services/ChecklistPendenciaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistPendenciaFilterSchema } from '../../schemas/checklistPendenciaSchema';
import { handleServerAction } from '../common/actionHandler';

export const listChecklistPendencias = async (rawData: unknown) =>
  handleServerAction(
    checklistPendenciaFilterSchema,
    async (data) => {
      const service = container.get<ChecklistPendenciaService>('checklistPendenciaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ChecklistPendencia', actionType: 'list' }
  );


