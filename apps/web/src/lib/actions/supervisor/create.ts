/**
 * Server Action para Criação de Supervisores
 */

'use server';

import type { SupervisorService } from '@/lib/services/pessoas/SupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { supervisorCreateSchema } from '../../schemas/supervisorSchema';
import { handleServerAction } from '../common/actionHandler';

export const createSupervisor = async (rawData: unknown) =>
  handleServerAction(
    supervisorCreateSchema,
    async (data, session) => {
      const service = container.get<SupervisorService>('supervisorService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Supervisor', actionType: 'create' }
  );

