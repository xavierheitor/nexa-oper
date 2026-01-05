/**
 * Server Action para Listagem de Turnos
 *
 * Esta action recupera uma lista paginada de turnos através
 * de Server Actions do Next.js, incluindo filtros, ordenação
 * e paginação.
 */

'use server';

import { turnoFilterSchema } from '../../schemas/turnoSchema';
import { container } from '../../services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';
import { TurnoService } from '../../services/turnos/TurnoService';

/**
 * Lista turnos com paginação e filtros
 *
 * @param rawData - Dados de filtro e paginação
 * @returns Lista paginada de turnos
 */
export const listTurnos = async (rawData: unknown) =>
  handleServerAction(
    turnoFilterSchema,
    async (data) => {
      const service = container.get<TurnoService>('turnoService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Turno', actionType: 'list' }
  );
