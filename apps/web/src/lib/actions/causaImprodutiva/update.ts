'use server';

import type { CausaImprodutivaService } from '@/lib/services/catalogo/CausaImprodutivaService';
import { container } from '@/lib/services/common/registerServices';
import { causaImprodutivaUpdateSchema } from '@/lib/schemas/causaImprodutivaSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateCausaImprodutiva = async (rawData: unknown) =>
  handleServerAction(
    causaImprodutivaUpdateSchema,
    async (data, session) => {
      const service = container.get<CausaImprodutivaService>(
        'causaImprodutivaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'CausaImprodutiva', actionType: 'update' }
  );
