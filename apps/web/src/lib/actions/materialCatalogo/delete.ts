'use server';

import type { MaterialCatalogoService } from '@/lib/services/catalogo/MaterialCatalogoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireMateriaisCatalogoPermission } from '../common/permissionGuard';

const schema = z.object({ id: z.number().int().positive() });

export const deleteMaterialCatalogo = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      requireMateriaisCatalogoPermission(session);
      const service = container.get<MaterialCatalogoService>(
        'materialCatalogoService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'MaterialCatalogo', actionType: 'delete' }
  );
