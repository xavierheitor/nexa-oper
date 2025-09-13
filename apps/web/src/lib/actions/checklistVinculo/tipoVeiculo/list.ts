'use server';

import type { ChecklistTipoVeiculoVinculoService } from '@/lib/services/ChecklistTipoVeiculoVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../../common/actionHandler';
import { z } from 'zod';

const listSchema = z.object({
  page: z.number().int().default(1),
  pageSize: z.number().int().default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  include: z.any().optional(),
});

export const listChecklistTipoVeiculoVinculos = async (rawData: unknown) =>
  handleServerAction(
    listSchema,
    async (data) => {
      const service = container.get<ChecklistTipoVeiculoVinculoService>('checklistTipoVeiculoVinculoService');
      return service.list(data as any);
    },
    rawData,
    { entityName: 'ChecklistTipoVeiculoRelacao', actionType: 'list' }
  );
