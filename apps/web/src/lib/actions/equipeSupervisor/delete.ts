/**
 * Server Action para excluir vínculo Equipe-Supervisor (soft delete)
 */

'use server';

import type { EquipeSupervisorService } from '@/lib/services/infraestrutura/EquipeSupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireSupervisoresPermission } from '../common/permissionGuard';

const deleteSchema = z.object({ id: z.number().int().positive() });

export const deleteEquipeSupervisor = async (rawData: unknown) =>
  handleServerAction(
    deleteSchema,
    async (data, session) => {
      requireSupervisoresPermission(session);
      const service = container.get<EquipeSupervisorService>('equipeSupervisorService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'EquipeSupervisor', actionType: 'delete' }
  );

