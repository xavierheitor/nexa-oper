'use server';

import type { ProjTipoRamalService } from '@/lib/services/projetos/ProjTipoRamalService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposRamalPermission } from '../common/permissionGuard';

const deleteProjTipoRamalSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjTipoRamal = async (rawData: unknown) =>
  handleServerAction(
    deleteProjTipoRamalSchema,
    async (data, session) => {
      requireProjetosTiposRamalPermission(session);
      const service = container.get<ProjTipoRamalService>('projTipoRamalService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoRamal', actionType: 'delete' }
  );
