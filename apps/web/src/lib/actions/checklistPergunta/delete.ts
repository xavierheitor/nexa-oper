'use server';

import type { ChecklistPerguntaService } from '@/lib/services/ChecklistPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteChecklistPergunta = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<ChecklistPerguntaService>('checklistPerguntaService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistPergunta', actionType: 'delete' }
  );

