/**
 * Server Action para Listagem de Supervisores
 */

'use server';

import type { SupervisorService } from '@/lib/services/pessoas/SupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { supervisorFilterSchema } from '../../schemas/supervisorSchema';
import { handleServerAction } from '../common/actionHandler';

export const listSupervisores = async (rawData: unknown) =>
  handleServerAction(
    supervisorFilterSchema,
    async (data) => {
      const service = container.get<SupervisorService>('supervisorService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Supervisor', actionType: 'list' }
  );

