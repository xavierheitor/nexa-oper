/**
 * Server Action para Atualização de Supervisores
 */

'use server';

import type { SupervisorService } from '@/lib/services/pessoas/SupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { supervisorUpdateSchema } from '../../schemas/supervisorSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateSupervisor = async (rawData: unknown) =>
  handleServerAction(
    supervisorUpdateSchema,
    async (data, session) => {
      const service = container.get<SupervisorService>('supervisorService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Supervisor', actionType: 'update' }
  );

