'use server';

import type { ChecklistOpcaoRespostaService } from '@/lib/services/checklist/ChecklistOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteChecklistOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<ChecklistOpcaoRespostaService>('checklistOpcaoRespostaService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistOpcaoResposta', actionType: 'delete' }
  );

