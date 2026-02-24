'use server';

import type { MaterialCatalogoService } from '@/lib/services/catalogo/MaterialCatalogoService';
import { container } from '@/lib/services/common/registerServices';
import { materialCatalogoFilterSchema } from '../../schemas/materialCatalogoSchema';
import { handleServerAction } from '../common/actionHandler';

export const listMateriaisCatalogo = async (rawData: unknown) =>
  handleServerAction(
    materialCatalogoFilterSchema,
    async (data) => {
      const service = container.get<MaterialCatalogoService>(
        'materialCatalogoService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'MaterialCatalogo', actionType: 'list' }
  );
