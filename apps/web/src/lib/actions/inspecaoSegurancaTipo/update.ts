'use server';

import type { InspecaoSegurancaTipoService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaTipoUpdateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaTiposPermission } from '../common/permissionGuard';

export const updateInspecaoSegurancaTipo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaTipoUpdateSchema,
    async (data, session) => {
      requireInspecaoSegurancaTiposPermission(session);
      const service = container.get<InspecaoSegurancaTipoService>(
        'inspecaoSegurancaTipoService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaTipo', actionType: 'update' }
  );
