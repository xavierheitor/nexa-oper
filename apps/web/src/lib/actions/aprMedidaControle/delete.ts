'use server';

import { z } from 'zod';

import type { AprMedidaControleService } from '@/lib/services/apr/AprMedidaControleService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

const deleteAprMedidaControleSchema = z.object({
  id: z.number().int().positive('ID deve ser um número positivo'),
});

export const deleteAprMedidaControle = async (rawData: unknown) =>
  handleServerAction(
    deleteAprMedidaControleSchema,
    async (validatedData, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprMedidaControleService>(
        'aprMedidaControleService'
      );
      return service.delete(validatedData.id, session.user.id);
    },
    rawData,
    {
      entityName: 'AprMedidaControle',
      actionType: 'delete',
    }
  );
