'use server';

import type { InspecaoSegurancaOpcaoRespostaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaOpcaoRespostaUpdateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaOpcoesPermission } from '../common/permissionGuard';

export const updateInspecaoSegurancaOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaOpcaoRespostaUpdateSchema,
    async (data, session) => {
      requireInspecaoSegurancaOpcoesPermission(session);
      const service = container.get<InspecaoSegurancaOpcaoRespostaService>(
        'inspecaoSegurancaOpcaoRespostaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaOpcaoResposta', actionType: 'update' }
  );
