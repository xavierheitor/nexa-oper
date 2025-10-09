/**
 * Server Action para buscar cargo por ID
 */

'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { container } from '@/lib/services/common/registerServices';
import type { CargoService } from '@/lib/services/CargoService';

export const getCargoById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<CargoService>('cargoService');
      return service.getById(id);
    },
    {},
    { entityName: 'Cargo', actionType: 'get' }
  );

