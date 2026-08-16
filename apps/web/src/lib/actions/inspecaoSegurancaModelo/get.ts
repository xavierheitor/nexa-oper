'use server';

import type { InspecaoSegurancaModeloService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGetSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaModelosPermission } from '../common/permissionGuard';

export const getInspecaoSegurancaModelo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGetSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaModelosPermission(session);
      const service = container.get<InspecaoSegurancaModeloService>(
        'inspecaoSegurancaModeloService'
      );
      return service.getById(id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaModelo', actionType: 'get' }
  );
