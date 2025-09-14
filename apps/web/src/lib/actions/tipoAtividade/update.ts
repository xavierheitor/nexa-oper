'use server';

import type { TipoAtividadeService } from '@/lib/services/TipoAtividadeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeUpdateSchema } from '../../schemas/tipoAtividadeSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateTipoAtividade = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeUpdateSchema,
    async (data, session) => {
      const service = container.get<TipoAtividadeService>('tipoAtividadeService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividade', actionType: 'update' }
  );

