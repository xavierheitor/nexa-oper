/**
 * Server Action para listar horas extras com filtros
 * Acessa o banco diretamente via Prisma (não chama API)
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { horaExtraFilterSchema } from '../../schemas/turnoRealizadoSchema';
import { container } from '../../services/common/registerServices';
import type { HoraExtraService } from '../../services/HoraExtraService';

/**
 * Lista horas extras com filtros e paginação
 */
export const listHorasExtras = async (rawData: unknown) =>
  handleServerAction(
    horaExtraFilterSchema,
    async (data) => {
      const service = container.get<HoraExtraService>('horaExtraService');
      return service.list(data);
    },
    rawData,
    { entityName: 'HoraExtra', actionType: 'list' }
  );

