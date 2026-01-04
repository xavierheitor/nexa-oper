'use server';

import type { ChecklistPerguntaService } from '@/lib/services/checklist/ChecklistPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistPerguntaUpdateSchema } from '../../schemas/checklistPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateChecklistPergunta = async (rawData: unknown) =>
  handleServerAction(
    checklistPerguntaUpdateSchema,
    async (data, session) => {
      const service = container.get<ChecklistPerguntaService>('checklistPerguntaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistPergunta', actionType: 'update' }
  );

