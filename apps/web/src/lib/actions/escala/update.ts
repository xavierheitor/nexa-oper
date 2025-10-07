// apps/web/src/lib/actions/escala/update.ts

/**
 * Server Action responsável por atualizar escalas existentes.
 */

'use server';

import { escalaUpdateSchema } from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const updateEscala = async (rawData: unknown) =>
  handleServerAction(
    escalaUpdateSchema,
    async (data, session) => {
      const service = container.get<EscalaService>('escalaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Escala', actionType: 'update' }
  );
