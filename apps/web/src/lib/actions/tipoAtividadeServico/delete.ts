'use server';

import type { TipoAtividadeServicoService } from '@/lib/services/catalogo/TipoAtividadeServicoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteTipoAtividadeServico = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<TipoAtividadeServicoService>(
        'tipoAtividadeServicoService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividadeServico', actionType: 'delete' }
  );
