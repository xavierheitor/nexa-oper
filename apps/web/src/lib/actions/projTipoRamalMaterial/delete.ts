'use server';

import type { ProjTipoRamalMaterialService } from '@/lib/services/projetos/ProjTipoRamalMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisRamalPermission } from '../common/permissionGuard';

const deleteProjTipoRamalMaterialSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjTipoRamalMaterial = async (rawData: unknown) =>
  handleServerAction(
    deleteProjTipoRamalMaterialSchema,
    async (data, session) => {
      requireProjetosMateriaisRamalPermission(session);
      const service = container.get<ProjTipoRamalMaterialService>(
        'projTipoRamalMaterialService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoRamalMaterial', actionType: 'delete' }
  );
