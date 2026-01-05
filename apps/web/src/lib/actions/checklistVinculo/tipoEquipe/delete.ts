'use server';

import type { ChecklistTipoEquipeVinculoService } from '@/lib/services/checklist/ChecklistTipoEquipeVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteChecklistTipoEquipeVinculo = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<ChecklistTipoEquipeVinculoService>('checklistTipoEquipeVinculoService');
      return service.delete(data.id, session.user.id as any);
    },
    rawData,
    { entityName: 'ChecklistTipoEquipeRelacao', actionType: 'delete' }
  );

