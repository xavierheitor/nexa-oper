'use server';

import type { ChecklistPendenciaService } from '@/lib/services/checklist/ChecklistPendenciaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistPendenciaUpdateSchema } from '../../schemas/checklistPendenciaSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateChecklistPendencia = async (rawData: unknown) =>
  handleServerAction(
    checklistPendenciaUpdateSchema,
    async (data, session) => {
      const service = container.get<ChecklistPendenciaService>('checklistPendenciaService');
      // Se o status for TRATADA, adiciona informações de tratamento
      const updateData: typeof data = {
        ...data,
        ...(data.status === 'TRATADA' && {
          tratadoPor: data.tratadoPor || session.user.username || session.user.id,
          tratadoEm: data.tratadoEm || new Date(),
        }),
      };
      return service.update(updateData, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistPendencia', actionType: 'update' }
  );


