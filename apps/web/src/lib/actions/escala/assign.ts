// apps/web/src/lib/actions/escala/assign.ts

/**
 * Server Action para atribuição de eletricistas aos horários da escala.
 */

'use server';

import { escalaAssignSchema } from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const assignEscala = async (rawData: unknown) =>
  handleServerAction(
    escalaAssignSchema,
    async (data, session) => {
      const service = container.get<EscalaService>('escalaService');
      return service.assignEletricistas(data, session.user.id);
    },
    rawData,
    { entityName: 'Escala', actionType: 'update' }
  );
