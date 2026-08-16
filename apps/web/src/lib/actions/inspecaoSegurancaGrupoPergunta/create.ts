'use server';

import type { InspecaoSegurancaGrupoPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGrupoPerguntaCreateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaGruposPermission } from '../common/permissionGuard';

export const createInspecaoSegurancaGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGrupoPerguntaCreateSchema,
    async (data, session) => {
      requireInspecaoSegurancaGruposPermission(session);
      const service = container.get<InspecaoSegurancaGrupoPerguntaService>(
        'inspecaoSegurancaGrupoPerguntaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaGrupoPergunta', actionType: 'create' }
  );
