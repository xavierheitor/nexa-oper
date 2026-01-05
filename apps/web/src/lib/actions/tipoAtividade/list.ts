'use server';

import type { TipoAtividadeService } from '@/lib/services/catalogo/TipoAtividadeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeFilterSchema } from '../../schemas/tipoAtividadeSchema';
import { handleServerAction } from '../common/actionHandler';

export const listTiposAtividade = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeFilterSchema,
    async (data) => {
      const service = container.get<TipoAtividadeService>('tipoAtividadeService');
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoAtividade', actionType: 'list' }
  );

