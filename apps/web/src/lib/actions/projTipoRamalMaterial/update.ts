'use server';

import type { ProjTipoRamalMaterialService } from '@/lib/services/projetos/ProjTipoRamalMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoRamalMaterialUpdateSchema } from '../../schemas/projTipoRamalMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisRamalPermission } from '../common/permissionGuard';

export const updateProjTipoRamalMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoRamalMaterialUpdateSchema,
    async (data, session) => {
      requireProjetosMateriaisRamalPermission(session);
      const service = container.get<ProjTipoRamalMaterialService>(
        'projTipoRamalMaterialService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoRamalMaterial', actionType: 'update' }
  );
