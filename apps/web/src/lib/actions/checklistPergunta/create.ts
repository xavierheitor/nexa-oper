'use server';

import type { ChecklistPerguntaService } from '@/lib/services/checklist/ChecklistPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistPerguntaCreateSchema } from '../../schemas/checklistPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireChecklistPerguntasPermission } from '../common/permissionGuard';

export const createChecklistPergunta = async (rawData: unknown) =>
  handleServerAction(
    checklistPerguntaCreateSchema,
    async (data, session) => {
      requireChecklistPerguntasPermission(session);
      const service = container.get<ChecklistPerguntaService>('checklistPerguntaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistPergunta', actionType: 'create' }
  );

