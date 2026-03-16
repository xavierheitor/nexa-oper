'use server';

import type { ChecklistOpcaoRespostaService } from '@/lib/services/checklist/ChecklistOpcaoRespostaService';
import { container } from '@/lib/services/common/registerServices';
import { checklistOpcaoRespostaFilterSchema } from '../../schemas/checklistOpcaoRespostaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireChecklistOpcoesPermission } from '../common/permissionGuard';

export const listChecklistOpcoesResposta = async (rawData: unknown) =>
  handleServerAction(
    checklistOpcaoRespostaFilterSchema,
    async (data, session) => {
      requireChecklistOpcoesPermission(session);
      const service = container.get<ChecklistOpcaoRespostaService>('checklistOpcaoRespostaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ChecklistOpcaoResposta', actionType: 'list' }
  );

