/**
 * Server Action para criar cargo
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { cargoCreateSchema } from '@/lib/schemas/cargoSchema';
import { container } from '@/lib/services/common/registerServices';
import type { CargoService } from '@/lib/services/CargoService';

export const createCargo = async (rawData: unknown) =>
  handleServerAction(
    cargoCreateSchema,
    async (data, session) => {
      const service = container.get<CargoService>('cargoService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Cargo', actionType: 'create' }
  );

