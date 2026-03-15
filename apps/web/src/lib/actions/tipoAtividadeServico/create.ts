'use server';

import type { TipoAtividadeServicoService } from '@/lib/services/catalogo/TipoAtividadeServicoService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeServicoCreateSchema } from '../../schemas/tipoAtividadeServicoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireSubtiposAtividadePermission } from '../common/permissionGuard';

export const createTipoAtividadeServico = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeServicoCreateSchema,
    async (data, session) => {
      requireSubtiposAtividadePermission(session);
      const service = container.get<TipoAtividadeServicoService>(
        'tipoAtividadeServicoService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividadeServico', actionType: 'create' }
  );
