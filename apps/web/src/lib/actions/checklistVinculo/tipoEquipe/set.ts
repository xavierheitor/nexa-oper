'use server';

import type { ChecklistTipoEquipeVinculoService } from '@/lib/services/checklist/ChecklistTipoEquipeVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { setChecklistTipoEquipeSchema } from '@/lib/services/checklist/ChecklistTipoEquipeVinculoService';
import { handleServerAction } from '../../common/actionHandler';

export const setChecklistTipoEquipe = async (rawData: unknown) =>
  handleServerAction(
    setChecklistTipoEquipeSchema,
    async (data, session) => {
      const service = container.get<ChecklistTipoEquipeVinculoService>('checklistTipoEquipeVinculoService');
      return service.setMapping(data, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistTipoEquipeRelacao', actionType: 'set' }
  );

