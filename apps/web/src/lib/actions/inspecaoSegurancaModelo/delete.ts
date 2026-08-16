'use server';

import type { InspecaoSegurancaModeloService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaDeleteSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaModelosPermission } from '../common/permissionGuard';

export const deleteInspecaoSegurancaModelo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaDeleteSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaModelosPermission(session);
      const service = container.get<InspecaoSegurancaModeloService>(
        'inspecaoSegurancaModeloService'
      );
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaModelo', actionType: 'delete' }
  );
