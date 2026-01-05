/**
 * Server Action para criar vínculo Equipe-Supervisor
 */

'use server';

import type { EquipeSupervisorService } from '@/lib/services/infraestrutura/EquipeSupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { equipeSupervisorCreateSchema } from '../../schemas/equipeSupervisorSchema';
import { handleServerAction } from '../common/actionHandler';

export const createEquipeSupervisor = async (rawData: unknown) =>
  handleServerAction(
    equipeSupervisorCreateSchema,
    async (data, session) => {
      const service = container.get<EquipeSupervisorService>('equipeSupervisorService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'EquipeSupervisor', actionType: 'create' }
  );

