'use server';

import type { ProjTipoEstruturaService } from '@/lib/services/projetos/ProjTipoEstruturaService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaCreateSchema } from '../../schemas/projTipoEstruturaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosTiposEstruturaPermission } from '../common/permissionGuard';

export const createProjTipoEstrutura = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaCreateSchema,
    async (data, session) => {
      requireProjetosTiposEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaService>(
        'projTipoEstruturaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjTipoEstrutura', actionType: 'create' }
  );
