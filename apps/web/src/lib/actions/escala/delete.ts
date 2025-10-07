// apps/web/src/lib/actions/escala/delete.ts

/**
 * Server Action responsável por realizar o soft delete de escalas.
 */

'use server';

import { escalaIdSchema } from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const deleteEscala = async (rawData: unknown) =>
  handleServerAction(
    escalaIdSchema,
    async ({ id }, session) => {
      const service = container.get<EscalaService>('escalaService');
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'Escala', actionType: 'delete' }
  );
