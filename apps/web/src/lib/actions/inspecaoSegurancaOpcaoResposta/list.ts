'use server';

import type { InspecaoSegurancaOpcaoRespostaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaFilterSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaOpcoesPermission } from '../common/permissionGuard';

export const listInspecaoSegurancaOpcoesResposta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaFilterSchema,
    async (params, session) => {
      requireInspecaoSegurancaOpcoesPermission(session);
      const service = container.get<InspecaoSegurancaOpcaoRespostaService>(
        'inspecaoSegurancaOpcaoRespostaService'
      );
      return service.list(params);
    },
    rawData,
    { entityName: 'InspecaoSegurancaOpcaoResposta', actionType: 'list' }
  );
