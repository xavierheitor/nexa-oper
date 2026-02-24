'use server';

import type { TipoAtividadeServicoService } from '@/lib/services/catalogo/TipoAtividadeServicoService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeServicoUpdateSchema } from '../../schemas/tipoAtividadeServicoSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateTipoAtividadeServico = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeServicoUpdateSchema,
    async (data, session) => {
      const service = container.get<TipoAtividadeServicoService>(
        'tipoAtividadeServicoService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoAtividadeServico', actionType: 'update' }
  );
