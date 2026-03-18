'use server';

import type { ProjTipoPosteService } from '@/lib/services/projetos/ProjTipoPosteService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoPosteCreateSchema } from '../../schemas/projTipoPosteSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposPostePermission } from '../common/permissionGuard';

export const createProjTipoPoste = async (rawData: unknown) =>
  handleServerAction(
    projTipoPosteCreateSchema,
    async (data, session) => {
      requireProjetosTiposPostePermission(session);
      const service = container.get<ProjTipoPosteService>('projTipoPosteService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoPoste', actionType: 'create' }
  );
