'use server';

import type { InspecaoSegurancaTipoService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaTipoCreateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaTiposPermission } from '../common/permissionGuard';

export const createInspecaoSegurancaTipo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaTipoCreateSchema,
    async (data, session) => {
      requireInspecaoSegurancaTiposPermission(session);
      const service = container.get<InspecaoSegurancaTipoService>(
        'inspecaoSegurancaTipoService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaTipo', actionType: 'create' }
  );
