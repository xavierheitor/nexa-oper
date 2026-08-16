'use server';

import type { InspecaoSegurancaPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaDeleteSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaPerguntasPermission } from '../common/permissionGuard';

export const deleteInspecaoSegurancaPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaDeleteSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaPerguntasPermission(session);
      const service = container.get<InspecaoSegurancaPerguntaService>(
        'inspecaoSegurancaPerguntaService'
      );
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaPergunta', actionType: 'delete' }
  );
