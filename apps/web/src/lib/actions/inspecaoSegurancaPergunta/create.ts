'use server';

import type { InspecaoSegurancaPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaPerguntaCreateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaPerguntasPermission } from '../common/permissionGuard';

export const createInspecaoSegurancaPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaPerguntaCreateSchema,
    async (data, session) => {
      requireInspecaoSegurancaPerguntasPermission(session);
      const service = container.get<InspecaoSegurancaPerguntaService>(
        'inspecaoSegurancaPerguntaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaPergunta', actionType: 'create' }
  );
