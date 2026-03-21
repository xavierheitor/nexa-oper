'use server';

import type { ProjTipoEstruturaMaterialService } from '@/lib/services/projetos/ProjTipoEstruturaMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaMaterialUpdateSchema } from '../../schemas/projTipoEstruturaMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisEstruturaPermission } from '../common/permissionGuard';

export const updateProjTipoEstruturaMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaMaterialUpdateSchema,
    async (data, session) => {
      requireProjetosMateriaisEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaMaterialService>(
        'projTipoEstruturaMaterialService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoEstruturaMaterial', actionType: 'update' }
  );
