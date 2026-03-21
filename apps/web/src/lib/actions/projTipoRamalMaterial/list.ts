'use server';

import type { ProjTipoRamalMaterialService } from '@/lib/services/projetos/ProjTipoRamalMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoRamalMaterialFilterSchema } from '../../schemas/projTipoRamalMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisRamalPermission } from '../common/permissionGuard';

export const listProjTiposRamalMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoRamalMaterialFilterSchema,
    async (data, session) => {
      requireProjetosMateriaisRamalPermission(session);
      const service = container.get<ProjTipoRamalMaterialService>(
        'projTipoRamalMaterialService'
      );
      return service.list({
        ...data,
        include: {
          contrato: true,
          tipoRamal: true,
          material: true,
        },
      });
    },
    rawData,
    { entityName: 'ProjTipoRamalMaterial', actionType: 'list' }
  );
