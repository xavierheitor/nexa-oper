/**
 * Server Action para atualizar cargo
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { cargoUpdateSchema } from '@/lib/schemas/cargoSchema';
import { container } from '@/lib/services/common/registerServices';
import type { CargoService } from '@/lib/services/CargoService';

export const updateCargo = async (rawData: unknown) =>
  handleServerAction(
    cargoUpdateSchema,
    async (data, session) => {
      const service = container.get<CargoService>('cargoService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Cargo', actionType: 'update' }
  );

