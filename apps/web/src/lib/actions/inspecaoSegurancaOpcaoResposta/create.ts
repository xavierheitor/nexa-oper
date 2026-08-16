'use server';

import type { InspecaoSegurancaOpcaoRespostaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaOpcaoRespostaCreateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaOpcoesPermission } from '../common/permissionGuard';

export const createInspecaoSegurancaOpcaoResposta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaOpcaoRespostaCreateSchema,
    async (data, session) => {
      requireInspecaoSegurancaOpcoesPermission(session);
      const service = container.get<InspecaoSegurancaOpcaoRespostaService>(
        'inspecaoSegurancaOpcaoRespostaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaOpcaoResposta', actionType: 'create' }
  );
