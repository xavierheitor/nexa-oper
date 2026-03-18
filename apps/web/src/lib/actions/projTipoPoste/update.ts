'use server';

import type { ProjTipoPosteService } from '@/lib/services/projetos/ProjTipoPosteService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoPosteUpdateSchema } from '../../schemas/projTipoPosteSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposPostePermission } from '../common/permissionGuard';

export const updateProjTipoPoste = async (rawData: unknown) =>
  handleServerAction(
    projTipoPosteUpdateSchema,
    async (data, session) => {
      requireProjetosTiposPostePermission(session);
      const service = container.get<ProjTipoPosteService>('projTipoPosteService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoPoste', actionType: 'update' }
  );
