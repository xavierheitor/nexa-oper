/**
 * Server Action para deletar cargo
 */

'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { container } from '@/lib/services/common/registerServices';
import type { CargoService } from '@/lib/services/CargoService';

export const deleteCargo = async (rawData: unknown) =>
  handleServerAction(
    z.object({ id: z.number().int().positive() }),
    async (data, session) => {
      const service = container.get<CargoService>('cargoService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Cargo', actionType: 'delete' }
  );

