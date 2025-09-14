'use server';

import type { TipoAtividadeService } from '@/lib/services/TipoAtividadeService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteTipoAtividade = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<TipoAtividadeService>('tipoAtividadeService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividade', actionType: 'delete' }
  );

