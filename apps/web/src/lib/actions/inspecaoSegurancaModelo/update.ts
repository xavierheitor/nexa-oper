'use server';

import type { InspecaoSegurancaModeloService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaModeloUpdateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaModelosPermission } from '../common/permissionGuard';

export const updateInspecaoSegurancaModelo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaModeloUpdateSchema,
    async (data, session) => {
      requireInspecaoSegurancaModelosPermission(session);
      const service = container.get<InspecaoSegurancaModeloService>(
        'inspecaoSegurancaModeloService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaModelo', actionType: 'update' }
  );
