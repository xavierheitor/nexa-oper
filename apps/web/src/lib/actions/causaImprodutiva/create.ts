'use server';

import type { CausaImprodutivaService } from '@/lib/services/catalogo/CausaImprodutivaService';
import { container } from '@/lib/services/common/registerServices';
import { causaImprodutivaCreateSchema } from '@/lib/schemas/causaImprodutivaSchema';
import { handleServerAction } from '../common/actionHandler';

export const createCausaImprodutiva = async (rawData: unknown) =>
  handleServerAction(
    causaImprodutivaCreateSchema,
    async (data, session) => {
      const service = container.get<CausaImprodutivaService>(
        'causaImprodutivaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'CausaImprodutiva', actionType: 'create' }
  );
