'use server';

import type { InspecaoSegurancaTipoService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGetSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaTiposPermission } from '../common/permissionGuard';

export const getInspecaoSegurancaTipo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGetSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaTiposPermission(session);
      const service = container.get<InspecaoSegurancaTipoService>(
        'inspecaoSegurancaTipoService'
      );
      return service.getById(id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaTipo', actionType: 'get' }
  );
