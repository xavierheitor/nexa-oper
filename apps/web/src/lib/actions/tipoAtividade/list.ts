'use server';

import type { TipoAtividadeService } from '@/lib/services/catalogo/TipoAtividadeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeFilterSchema } from '../../schemas/tipoAtividadeSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireTiposAtividadePermission } from '../common/permissionGuard';

export const listTiposAtividade = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeFilterSchema,
    async (data, session) => {
      requireTiposAtividadePermission(session);
      const service = container.get<TipoAtividadeService>('tipoAtividadeService');
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoAtividade', actionType: 'list' }
  );

