'use server';

import type { InspecaoSegurancaPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaFilterSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaPerguntasPermission } from '../common/permissionGuard';

export const listInspecaoSegurancaPerguntas = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaFilterSchema,
    async (params, session) => {
      requireInspecaoSegurancaPerguntasPermission(session);
      const service = container.get<InspecaoSegurancaPerguntaService>(
        'inspecaoSegurancaPerguntaService'
      );
      return service.list(params);
    },
    rawData,
    { entityName: 'InspecaoSegurancaPergunta', actionType: 'list' }
  );
