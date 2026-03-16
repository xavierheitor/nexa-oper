/**
 * Server Action para buscar cargo por ID
 */

'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireCargosPermission } from '../common/permissionGuard';
import { container } from '@/lib/services/common/registerServices';
import type { CargoService } from '@/lib/services/pessoas/CargoService';

export const getCargoById = async (id: number) =>
  handleServerAction(
    z.object({}),
    async (_, session) => {
      requireCargosPermission(session);
      const service = container.get<CargoService>('cargoService');
      return service.getById(id);
    },
    {},
    { entityName: 'Cargo', actionType: 'get' }
  );

