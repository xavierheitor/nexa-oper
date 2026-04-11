'use server';

import type { AprMedidaControleService } from '@/lib/services/apr/AprMedidaControleService';
import { container } from '@/lib/services/common/registerServices';
import { aprMedidaControleCreateSchema } from '../../schemas/aprMedidaControleSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

export const createAprMedidaControle = async (rawData: unknown) =>
  handleServerAction(
    aprMedidaControleCreateSchema,
    async (validatedData, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprMedidaControleService>(
        'aprMedidaControleService'
      );
      return service.create(validatedData, session.user.id);
    },
    rawData,
    {
      entityName: 'AprMedidaControle',
      actionType: 'create',
    }
  );
