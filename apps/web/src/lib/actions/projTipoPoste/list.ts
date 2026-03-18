'use server';

import type { ProjTipoPosteService } from '@/lib/services/projetos/ProjTipoPosteService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoPosteFilterSchema } from '../../schemas/projTipoPosteSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposPostePermission } from '../common/permissionGuard';

export const listProjTiposPoste = async (rawData: unknown) =>
  handleServerAction(
    projTipoPosteFilterSchema,
    async (data, session) => {
      requireProjetosTiposPostePermission(session);
      const service = container.get<ProjTipoPosteService>('projTipoPosteService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjTipoPoste', actionType: 'list' }
  );
