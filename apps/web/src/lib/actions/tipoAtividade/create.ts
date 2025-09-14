'use server';

import type { TipoAtividadeService } from '@/lib/services/TipoAtividadeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeCreateSchema } from '../../schemas/tipoAtividadeSchema';
import { handleServerAction } from '../common/actionHandler';

export const createTipoAtividade = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeCreateSchema,
    async (data, session) => {
      const service = container.get<TipoAtividadeService>('tipoAtividadeService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividade', actionType: 'create' }
  );

