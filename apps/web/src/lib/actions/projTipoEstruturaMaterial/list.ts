'use server';

import type { ProjTipoEstruturaMaterialService } from '@/lib/services/projetos/ProjTipoEstruturaMaterialService';
import { container } from '@/lib/services/common/registerServices';
import { projTipoEstruturaMaterialFilterSchema } from '../../schemas/projTipoEstruturaMaterialSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjetosMateriaisEstruturaPermission } from '../common/permissionGuard';

export const listProjTiposEstruturaMaterial = async (rawData: unknown) =>
  handleServerAction(
    projTipoEstruturaMaterialFilterSchema,
    async (data, session) => {
      requireProjetosMateriaisEstruturaPermission(session);
      const service = container.get<ProjTipoEstruturaMaterialService>(
        'projTipoEstruturaMaterialService'
      );
      return service.list({
        ...data,
        include: {
          tipoEstrutura: {
            include: {
              contrato: true,
            },
          },
          material: true,
        },
      });
    },
    rawData,
    { entityName: 'ProjTipoEstruturaMaterial', actionType: 'list' }
  );
