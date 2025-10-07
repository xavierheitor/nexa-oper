// apps/web/src/lib/actions/escala/create.ts

/**
 * Server Action responsável por cadastrar novas escalas.
 */

'use server';

import { escalaCreateSchema } from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const createEscala = async (rawData: unknown) =>
  handleServerAction(
    escalaCreateSchema,
    async (data, session) => {
      const service = container.get<EscalaService>('escalaService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Escala', actionType: 'create' }
  );
