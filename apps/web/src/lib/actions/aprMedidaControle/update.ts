'use server';

import type { AprMedidaControleService } from '@/lib/services/apr/AprMedidaControleService';
import { container } from '@/lib/services/common/registerServices';
import { aprMedidaControleUpdateSchema } from '../../schemas/aprMedidaControleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

export const updateAprMedidaControle = async (rawData: unknown) =>
  handleServerAction(
    aprMedidaControleUpdateSchema,
    async (validatedData, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprMedidaControleService>(
        'aprMedidaControleService'
      );
      return service.update(validatedData, session.user.id);
    },
    rawData,
    {
      entityName: 'AprMedidaControle',
      actionType: 'update',
    }
  );
