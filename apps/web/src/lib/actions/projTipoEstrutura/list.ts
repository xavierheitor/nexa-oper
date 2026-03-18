'use server';

import type { ProjTipoEstruturaService } from '@/lib/services/projetos/ProjTipoEstruturaService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaFilterSchema } from '../../schemas/projTipoEstruturaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposEstruturaPermission } from '../common/permissionGuard';

export const listProjTiposEstrutura = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaFilterSchema,
    async (data, session) => {
      requireProjetosTiposEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaService>(
        'projTipoEstruturaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjTipoEstrutura', actionType: 'list' }
  );
