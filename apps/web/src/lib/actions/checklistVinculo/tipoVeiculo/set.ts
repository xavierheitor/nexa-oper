'use server';

import type { ChecklistTipoVeiculoVinculoService } from '@/lib/services/checklist/ChecklistTipoVeiculoVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { setChecklistTipoVeiculoSchema } from '@/lib/services/checklist/ChecklistTipoVeiculoVinculoService';
import { handleServerAction } from '../../common/actionHandler';
import { requireChecklistModelosPermission } from '../../common/permissionGuard';

export const setChecklistTipoVeiculo = async (rawData: unknown) =>
  handleServerAction(
    setChecklistTipoVeiculoSchema,
    async (data, session) => {
      requireChecklistModelosPermission(session);
      const service = container.get<ChecklistTipoVeiculoVinculoService>('checklistTipoVeiculoVinculoService');
      return service.setMapping(data, session.user.id);
    },
    rawData,
    { entityName: 'ChecklistTipoVeiculoRelacao', actionType: 'set' }
  );

