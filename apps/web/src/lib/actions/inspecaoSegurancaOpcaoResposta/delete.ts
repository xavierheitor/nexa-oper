'use server';

import type { InspecaoSegurancaOpcaoRespostaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaDeleteSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaOpcoesPermission } from '../common/permissionGuard';

export const deleteInspecaoSegurancaOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaDeleteSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaOpcoesPermission(session);
      const service = container.get<InspecaoSegurancaOpcaoRespostaService>(
        'inspecaoSegurancaOpcaoRespostaService'
      );
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaOpcaoResposta', actionType: 'delete' }
  );
