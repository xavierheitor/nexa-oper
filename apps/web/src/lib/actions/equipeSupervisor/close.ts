/**
 * Server Action para encerrar vínculo (definir fim como hoje)
 */

'use server';

import type { EquipeSupervisorService } from '@/lib/services/infraestrutura/EquipeSupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireSupervisoresPermission } from '../common/permissionGuard';

const schema = z.object({ id: z.number().int().positive() });

export const closeEquipeSupervisor = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      requireSupervisoresPermission(session);
      const service = container.get<EquipeSupervisorService>('equipeSupervisorService');
      return service.close(data.id, session.user.id);
    },
    rawData,
    { entityName: 'EquipeSupervisor', actionType: 'close' }
  );

