'use server';

import type { ProjTipoEstruturaMaterialService } from '@/lib/services/projetos/ProjTipoEstruturaMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisEstruturaPermission } from '../common/permissionGuard';

const deleteProjTipoEstruturaMaterialSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjTipoEstruturaMaterial = async (rawData: unknown) =>
  handleServerAction(
    deleteProjTipoEstruturaMaterialSchema,
    async (data, session) => {
      requireProjetosMateriaisEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaMaterialService>(
        'projTipoEstruturaMaterialService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoEstruturaMaterial', actionType: 'delete' }
  );
