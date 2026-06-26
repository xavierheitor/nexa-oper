'use server';

import type { ProjTipoRamalService } from '@/lib/services/projetos/ProjTipoRamalService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoRamalFilterSchema } from '../../schemas/projTipoRamalSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposRamalPermission } from '../common/permissionGuard';

export const listProjTiposRamal = async (rawData: unknown) =>
  handleServerAction(
    projTipoRamalFilterSchema,
    async (data, session) => {
      requireProjetosTiposRamalPermission(session);
      const service = container.get<ProjTipoRamalService>('projTipoRamalService');
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjTipoRamal', actionType: 'list' }
  );
