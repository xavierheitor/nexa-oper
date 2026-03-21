'use server';

import type { ProjTipoRamalMaterialService } from '@/lib/services/projetos/ProjTipoRamalMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoRamalMaterialCreateSchema } from '../../schemas/projTipoRamalMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisRamalPermission } from '../common/permissionGuard';

export const createProjTipoRamalMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoRamalMaterialCreateSchema,
    async (data, session) => {
      requireProjetosMateriaisRamalPermission(session);
      const service = container.get<ProjTipoRamalMaterialService>(
        'projTipoRamalMaterialService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoRamalMaterial', actionType: 'create' }
  );
