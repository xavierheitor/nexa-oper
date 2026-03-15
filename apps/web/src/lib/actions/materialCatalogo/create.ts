'use server';

import type { MaterialCatalogoService } from '@/lib/services/catalogo/MaterialCatalogoService';
import { container } from '@/lib/services/common/registerServices';
import { materialCatalogoCreateSchema } from '../../schemas/materialCatalogoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireMateriaisCatalogoPermission } from '../common/permissionGuard';

export const createMaterialCatalogo = async (rawData: unknown) =>
  handleServerAction(
    materialCatalogoCreateSchema,
    async (data, session) => {
      requireMateriaisCatalogoPermission(session);
      const service = container.get<MaterialCatalogoService>(
        'materialCatalogoService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'MaterialCatalogo', actionType: 'create' }
  );
