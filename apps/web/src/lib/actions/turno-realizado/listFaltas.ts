/**
 * Server Action para listar faltas com filtros
 * Acessa o banco diretamente via Prisma (não chama API)
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { faltaFilterSchema } from '../../schemas/turnoRealizadoSchema';
import { container } from '../../services/common/registerServices';
import type { FaltaService } from '../../services/turnos/FaltaService';

/**
 * Lista faltas com filtros e paginação
 */
export const listFaltas = async (rawData: unknown) =>
  handleServerAction(
    faltaFilterSchema,
    async (data) => {
      const service = container.get<FaltaService>('faltaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Falta', actionType: 'list' }
  );

