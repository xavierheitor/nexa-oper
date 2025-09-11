/**
 * Server Action para Exclusão de Supervisores
 */

'use server';

import type { SupervisorService } from '@/lib/services/SupervisorService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const deleteSupervisorSchema = z.object({ id: z.number().int().positive() });

export const deleteSupervisor = async (rawData: unknown) =>
  handleServerAction(
    deleteSupervisorSchema,
    async (data, session) => {
      const service = container.get<SupervisorService>('supervisorService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Supervisor', actionType: 'delete' }
  );

