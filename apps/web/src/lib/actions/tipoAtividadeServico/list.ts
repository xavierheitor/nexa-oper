'use server';

import type { TipoAtividadeServicoService } from '@/lib/services/catalogo/TipoAtividadeServicoService';
import { container } from '@/lib/services/common/registerServices';
import { tipoAtividadeServicoFilterSchema } from '../../schemas/tipoAtividadeServicoSchema';
import { handleServerAction } from '../common/actionHandler';

export const listTiposAtividadeServico = async (rawData: unknown) =>
  handleServerAction(
    tipoAtividadeServicoFilterSchema,
    async (data) => {
      const service = container.get<TipoAtividadeServicoService>(
        'tipoAtividadeServicoService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoAtividadeServico', actionType: 'list' }
  );
