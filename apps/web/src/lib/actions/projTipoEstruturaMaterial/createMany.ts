'use server';

import type { ProjTipoEstruturaMaterialService } from '@/lib/services/projetos/ProjTipoEstruturaMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaMaterialCreateBatchSchema } from '../../schemas/projTipoEstruturaMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisEstruturaPermission } from '../common/permissionGuard';

export const createManyProjTipoEstruturaMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaMaterialCreateBatchSchema,
    async (data, session) => {
      requireProjetosMateriaisEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaMaterialService>(
        'projTipoEstruturaMaterialService'
      );
      return service.createMany(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoEstruturaMaterial', actionType: 'create' }
  );
