'use server';

import type { ChecklistPendenciaService } from '@/lib/services/checklist/ChecklistPendenciaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistPendenciaGetSchema } from '../../schemas/checklistPendenciaSchema';
import { handleServerAction } from '../common/actionHandler';

export const getChecklistPendencia = async (rawData: unknown) =>
  handleServerAction(
    checklistPendenciaGetSchema,
    async (data) => {
      const service = container.get<ChecklistPendenciaService>('checklistPendenciaService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'ChecklistPendencia', actionType: 'get' }
  );


