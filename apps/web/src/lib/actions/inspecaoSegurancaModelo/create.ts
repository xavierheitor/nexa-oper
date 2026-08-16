'use server';

import type { InspecaoSegurancaModeloService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaModeloCreateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaModelosPermission } from '../common/permissionGuard';

export const createInspecaoSegurancaModelo = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaModeloCreateSchema,
    async (data, session) => {
      requireInspecaoSegurancaModelosPermission(session);
      const service = container.get<InspecaoSegurancaModeloService>(
        'inspecaoSegurancaModeloService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaModelo', actionType: 'create' }
  );
