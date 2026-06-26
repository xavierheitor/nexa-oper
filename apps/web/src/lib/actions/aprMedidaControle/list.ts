'use server';

import type { AprMedidaControleService } from '@/lib/services/apr/AprMedidaControleService';
import { container } from '@/lib/services/common/registerServices';
import { aprMedidaControleFilterSchema } from '../../schemas/aprMedidaControleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

export const listAprMedidasControle = async (rawData: unknown) =>
  handleServerAction(
    aprMedidaControleFilterSchema,
    async (validatedParams, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprMedidaControleService>(
        'aprMedidaControleService'
      );
      return service.list(validatedParams);
    },
    rawData,
    {
      entityName: 'AprMedidaControle',
      actionType: 'list',
    }
  );
