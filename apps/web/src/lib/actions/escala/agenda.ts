// apps/web/src/lib/actions/escala/agenda.ts

/**
 * Server Action responsável por gerar a agenda de uma escala.
 */

'use server';

import { escalaAgendaSchema } from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const generateAgendaEscala = async (rawData: unknown) =>
  handleServerAction(
    escalaAgendaSchema,
    async (data, _session) => {
      const service = container.get<EscalaService>('escalaService');
      return service.generateAgenda(data);
    },
    rawData,
    { entityName: 'Escala', actionType: 'get' }
  );
