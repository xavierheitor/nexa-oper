'use server';

import type { CausaImprodutivaService } from '@/lib/services/catalogo/CausaImprodutivaService';
import { container } from '@/lib/services/common/registerServices';
import { causaImprodutivaUpdateSchema } from '@/lib/schemas/causaImprodutivaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireCausasImprodutivasPermission } from '../common/permissionGuard';

export const updateCausaImprodutiva = async (rawData: unknown) =>
  handleServerAction(
    causaImprodutivaUpdateSchema,
    async (data, session) => {
      requireCausasImprodutivasPermission(session);
      const service = container.get<CausaImprodutivaService>(
        'causaImprodutivaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'CausaImprodutiva', actionType: 'update' }
  );
