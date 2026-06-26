'use server';

import type { ProjTipoRamalService } from '@/lib/services/projetos/ProjTipoRamalService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoRamalUpdateSchema } from '../../schemas/projTipoRamalSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposRamalPermission } from '../common/permissionGuard';

export const updateProjTipoRamal = async (rawData: unknown) =>
  handleServerAction(
    projTipoRamalUpdateSchema,
    async (data, session) => {
      requireProjetosTiposRamalPermission(session);
      const service = container.get<ProjTipoRamalService>('projTipoRamalService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoRamal', actionType: 'update' }
  );
