'use server';

import type { ChecklistOpcaoRespostaService } from '@/lib/services/checklist/ChecklistOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistOpcaoRespostaUpdateSchema } from '../../schemas/checklistOpcaoRespostaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireChecklistOpcoesPermission } from '../common/permissionGuard';

export const updateChecklistOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    checklistOpcaoRespostaUpdateSchema,
    async (data, session) => {
      requireChecklistOpcoesPermission(session);
      const service = container.get<ChecklistOpcaoRespostaService>('checklistOpcaoRespostaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistOpcaoResposta', actionType: 'update' }
  );

