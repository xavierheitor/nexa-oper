// apps/web/src/lib/actions/escala/get.ts

/**
 * Server Action para buscar detalhes de uma escala específica.
 */

'use server';

import { escalaIdSchema } from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const getEscala = async (rawData: unknown) =>
  handleServerAction(
    escalaIdSchema,
    async ({ id }) => {
      const service = container.get<EscalaService>('escalaService');
      const escala = await service.getById(id);
      if (!escala) {
        throw new Error('Escala não encontrada');
      }
      return escala;
    },
    rawData,
    { entityName: 'Escala', actionType: 'get' }
  );
