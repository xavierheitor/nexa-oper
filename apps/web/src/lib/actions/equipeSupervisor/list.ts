/**
 * Server Action para listar vínculos Equipe-Supervisor
 */

'use server';

import type { EquipeSupervisorService } from '@/lib/services/infraestrutura/EquipeSupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { equipeSupervisorFilterSchema } from '../../schemas/equipeSupervisorSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireSupervisoresPermission } from '../common/permissionGuard';

export const listEquipesSupervisores = async (rawData: unknown) =>
  handleServerAction(
    equipeSupervisorFilterSchema,
    async (data, session) => {
      requireSupervisoresPermission(session);
      const service = container.get<EquipeSupervisorService>('equipeSupervisorService');
      return service.list(data);
    },
    rawData,
    { entityName: 'EquipeSupervisor', actionType: 'list' }
  );

