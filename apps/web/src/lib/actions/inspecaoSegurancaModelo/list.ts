'use server';

import type { InspecaoSegurancaModeloService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaFilterSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaModelosPermission } from '../common/permissionGuard';

export const listInspecaoSegurancaModelos = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaFilterSchema,
    async (params, session) => {
      requireInspecaoSegurancaModelosPermission(session);
      const service = container.get<InspecaoSegurancaModeloService>(
        'inspecaoSegurancaModeloService'
      );
      return service.list(params);
    },
    rawData,
    { entityName: 'InspecaoSegurancaModelo', actionType: 'list' }
  );
