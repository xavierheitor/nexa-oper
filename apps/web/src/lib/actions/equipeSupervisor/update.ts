/**
 * Server Action para atualizar vínculo Equipe-Supervisor
 */

'use server';

import type { EquipeSupervisorService } from '@/lib/services/infraestrutura/EquipeSupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { equipeSupervisorUpdateSchema } from '../../schemas/equipeSupervisorSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireSupervisoresPermission } from '../common/permissionGuard';

export const updateEquipeSupervisor = async (rawData: unknown) =>
  handleServerAction(
    equipeSupervisorUpdateSchema,
    async (data, session) => {
      requireSupervisoresPermission(session);
      const service = container.get<EquipeSupervisorService>('equipeSupervisorService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'EquipeSupervisor', actionType: 'update' }
  );

