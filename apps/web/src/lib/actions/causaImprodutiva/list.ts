'use server';

import type { CausaImprodutivaService } from '@/lib/services/catalogo/CausaImprodutivaService';
import { container } from '@/lib/services/common/registerServices';
import { causaImprodutivaFilterSchema } from '@/lib/schemas/causaImprodutivaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireCausasImprodutivasPermission } from '../common/permissionGuard';

export const listCausasImprodutivas = async (rawData: unknown) =>
  handleServerAction(
    causaImprodutivaFilterSchema,
    async (data, session) => {
      requireCausasImprodutivasPermission(session);
      const service = container.get<CausaImprodutivaService>(
        'causaImprodutivaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'CausaImprodutiva', actionType: 'list' }
  );
