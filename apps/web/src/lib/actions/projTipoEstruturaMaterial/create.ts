'use server';

import type { ProjTipoEstruturaMaterialService } from '@/lib/services/projetos/ProjTipoEstruturaMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaMaterialCreateSchema } from '../../schemas/projTipoEstruturaMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisEstruturaPermission } from '../common/permissionGuard';

export const createProjTipoEstruturaMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaMaterialCreateSchema,
    async (data, session) => {
      requireProjetosMateriaisEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaMaterialService>(
        'projTipoEstruturaMaterialService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoEstruturaMaterial', actionType: 'create' }
  );
