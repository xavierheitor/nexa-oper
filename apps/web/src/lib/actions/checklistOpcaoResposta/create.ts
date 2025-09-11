'use server';

import type { ChecklistOpcaoRespostaService } from '@/lib/services/ChecklistOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistOpcaoRespostaCreateSchema } from '../../schemas/checklistOpcaoRespostaSchema';
import { handleServerAction } from '../common/actionHandler';

export const createChecklistOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    checklistOpcaoRespostaCreateSchema,
    async (data, session) => {
      const service = container.get<ChecklistOpcaoRespostaService>('checklistOpcaoRespostaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistOpcaoResposta', actionType: 'create' }
  );

