'use server';

import type { InspecaoSegurancaTipoService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaDeleteSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaTiposPermission } from '../common/permissionGuard';

export const deleteInspecaoSegurancaTipo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaDeleteSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaTiposPermission(session);
      const service = container.get<InspecaoSegurancaTipoService>(
        'inspecaoSegurancaTipoService'
      );
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaTipo', actionType: 'delete' }
  );
