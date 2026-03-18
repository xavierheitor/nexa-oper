'use server';

import type { ProjTipoPosteService } from '@/lib/services/projetos/ProjTipoPosteService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposPostePermission } from '../common/permissionGuard';

const deleteProjTipoPosteSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjTipoPoste = async (rawData: unknown) =>
  handleServerAction(
    deleteProjTipoPosteSchema,
    async (data, session) => {
      requireProjetosTiposPostePermission(session);
      const service = container.get<ProjTipoPosteService>('projTipoPosteService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoPoste', actionType: 'delete' }
  );
