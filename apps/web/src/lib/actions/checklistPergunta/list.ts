'use server';

import type { ChecklistPerguntaService } from '@/lib/services/ChecklistPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistPerguntaFilterSchema } from '../../schemas/checklistPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const listChecklistPerguntas = async (rawData: unknown) =>
  handleServerAction(
    checklistPerguntaFilterSchema,
    async (data) => {
      const service = container.get<ChecklistPerguntaService>('checklistPerguntaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ChecklistPergunta', actionType: 'list' }
  );

