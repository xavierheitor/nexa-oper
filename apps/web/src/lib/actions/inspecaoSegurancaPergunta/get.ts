'use server';

import type { InspecaoSegurancaPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGetSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaPerguntasPermission } from '../common/permissionGuard';

export const getInspecaoSegurancaPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGetSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaPerguntasPermission(session);
      const service = container.get<InspecaoSegurancaPerguntaService>(
        'inspecaoSegurancaPerguntaService'
      );
      return service.getById(id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaPergunta', actionType: 'get' }
  );
