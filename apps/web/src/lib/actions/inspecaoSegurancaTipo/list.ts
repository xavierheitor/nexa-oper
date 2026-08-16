'use server';

import type { InspecaoSegurancaTipoService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaFilterSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaTiposPermission } from '../common/permissionGuard';

export const listInspecaoSegurancaTipos = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaFilterSchema,
    async (params, session) => {
      requireInspecaoSegurancaTiposPermission(session);
      const service = container.get<InspecaoSegurancaTipoService>(
        'inspecaoSegurancaTipoService'
      );
      return service.list(params);
    },
    rawData,
    { entityName: 'InspecaoSegurancaTipo', actionType: 'list' }
  );
