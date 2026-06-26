'use server';

import type { ProjTipoRamalService } from '@/lib/services/projetos/ProjTipoRamalService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoRamalCreateSchema } from '../../schemas/projTipoRamalSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposRamalPermission } from '../common/permissionGuard';

export const createProjTipoRamal = async (rawData: unknown) =>
  handleServerAction(
    projTipoRamalCreateSchema,
    async (data, session) => {
      requireProjetosTiposRamalPermission(session);
      const service = container.get<ProjTipoRamalService>('projTipoRamalService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoRamal', actionType: 'create' }
  );
