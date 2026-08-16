'use server';

import type { InspecaoSegurancaOpcaoRespostaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGetSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaOpcoesPermission } from '../common/permissionGuard';

export const getInspecaoSegurancaOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGetSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaOpcoesPermission(session);
      const service = container.get<InspecaoSegurancaOpcaoRespostaService>(
        'inspecaoSegurancaOpcaoRespostaService'
      );
      return service.getById(id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaOpcaoResposta', actionType: 'get' }
  );
