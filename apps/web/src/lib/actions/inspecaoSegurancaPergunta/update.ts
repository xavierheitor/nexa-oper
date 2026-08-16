'use server';

import type { InspecaoSegurancaPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaPerguntaUpdateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaPerguntasPermission } from '../common/permissionGuard';

export const updateInspecaoSegurancaPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaPerguntaUpdateSchema,
    async (data, session) => {
      requireInspecaoSegurancaPerguntasPermission(session);
      const service = container.get<InspecaoSegurancaPerguntaService>(
        'inspecaoSegurancaPerguntaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaPergunta', actionType: 'update' }
  );
