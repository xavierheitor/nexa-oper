'use server';

import type { MaterialCatalogoService } from '@/lib/services/catalogo/MaterialCatalogoService';
import { container } from '@/lib/services/common/registerServices';
import { materialCatalogoUpdateSchema } from '../../schemas/materialCatalogoSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateMaterialCatalogo = async (rawData: unknown) =>
  handleServerAction(
    materialCatalogoUpdateSchema,
    async (data, session) => {
      const service = container.get<MaterialCatalogoService>(
        'materialCatalogoService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'MaterialCatalogo', actionType: 'update' }
  );
