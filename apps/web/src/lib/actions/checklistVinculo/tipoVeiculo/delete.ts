'use server';

import type { ChecklistTipoVeiculoVinculoService } from '@/lib/services/ChecklistTipoVeiculoVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteChecklistTipoVeiculoVinculo = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<ChecklistTipoVeiculoVinculoService>('checklistTipoVeiculoVinculoService');
      return service.delete(data.id, session.user.id as any);
    },
    rawData,
    { entityName: 'ChecklistTipoVeiculoRelacao', actionType: 'delete' }
  );

