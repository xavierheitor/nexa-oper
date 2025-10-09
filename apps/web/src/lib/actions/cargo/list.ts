/**
 * Server Action para listar cargos
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { cargoFilterSchema } from '@/lib/schemas/cargoSchema';
import { container } from '@/lib/services/common/registerServices';
import type { CargoService } from '@/lib/services/CargoService';

export const listCargos = async (rawData: unknown) =>
  handleServerAction(
    cargoFilterSchema,
    async (data) => {
      const service = container.get<CargoService>('cargoService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Cargo', actionType: 'list' }
  );

