'use server';

import type { CausaImprodutivaService } from '@/lib/services/catalogo/CausaImprodutivaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireCausasImprodutivasPermission } from '../common/permissionGuard';

const schema = z.object({ id: z.number().int().positive() });

export const deleteCausaImprodutiva = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      requireCausasImprodutivasPermission(session);
      const service = container.get<CausaImprodutivaService>(
        'causaImprodutivaService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'CausaImprodutiva', actionType: 'delete' }
  );
