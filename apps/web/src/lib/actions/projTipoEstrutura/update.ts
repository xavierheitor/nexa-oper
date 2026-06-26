'use server';

import type { ProjTipoEstruturaService } from '@/lib/services/projetos/ProjTipoEstruturaService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaUpdateSchema } from '../../schemas/projTipoEstruturaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposEstruturaPermission } from '../common/permissionGuard';

export const updateProjTipoEstrutura = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaUpdateSchema,
    async (data, session) => {
      requireProjetosTiposEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaService>(
        'projTipoEstruturaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjEstrutura', actionType: 'update' }
  );
