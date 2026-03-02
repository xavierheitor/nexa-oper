'use server';

import type { CausaImprodutivaService } from '@/lib/services/catalogo/CausaImprodutivaService';
import { container } from '@/lib/services/common/registerServices';
import { causaImprodutivaFilterSchema } from '@/lib/schemas/causaImprodutivaSchema';
import { handleServerAction } from '../common/actionHandler';

export const listCausasImprodutivas = async (rawData: unknown) =>
  handleServerAction(
    causaImprodutivaFilterSchema,
    async (data) => {
      const service = container.get<CausaImprodutivaService>(
        'causaImprodutivaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'CausaImprodutiva', actionType: 'list' }
  );
