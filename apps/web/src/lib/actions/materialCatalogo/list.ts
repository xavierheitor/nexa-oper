'use server';

import type { MaterialCatalogoService } from '@/lib/services/catalogo/MaterialCatalogoService';
import { container } from '@/lib/services/common/registerServices';
import { materialCatalogoFilterSchema } from '../../schemas/materialCatalogoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireMateriaisCatalogoPermission } from '../common/permissionGuard';

export const listMateriaisCatalogo = async (rawData: unknown) =>
  handleServerAction(
    materialCatalogoFilterSchema,
    async (data, session) => {
      requireMateriaisCatalogoPermission(session);
      const service = container.get<MaterialCatalogoService>(
        'materialCatalogoService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'MaterialCatalogo', actionType: 'list' }
  );
