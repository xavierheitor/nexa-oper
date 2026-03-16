'use server';

import type { TipoAtividadeService } from '@/lib/services/catalogo/TipoAtividadeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeCreateSchema } from '../../schemas/tipoAtividadeSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireTiposAtividadePermission } from '../common/permissionGuard';

export const createTipoAtividade = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeCreateSchema,
    async (data, session) => {
      requireTiposAtividadePermission(session);
      const service = container.get<TipoAtividadeService>('tipoAtividadeService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividade', actionType: 'create' }
  );

