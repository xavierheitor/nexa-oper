'use server';

import type { ProjTipoEstruturaService } from '@/lib/services/projetos/ProjTipoEstruturaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposEstruturaPermission } from '../common/permissionGuard';

const deleteProjTipoEstruturaSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjTipoEstrutura = async (rawData: unknown) =>
  handleServerAction(
    deleteProjTipoEstruturaSchema,
    async (data, session) => {
      requireProjetosTiposEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaService>(
        'projTipoEstruturaService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjEstrutura', actionType: 'delete' }
  );
