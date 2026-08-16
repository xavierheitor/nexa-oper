'use server';

import type { InspecaoSegurancaGrupoPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGrupoPerguntaUpdateSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaGruposPermission } from '../common/permissionGuard';

export const updateInspecaoSegurancaGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGrupoPerguntaUpdateSchema,
    async (data, session) => {
      requireInspecaoSegurancaGruposPermission(session);
      const service = container.get<InspecaoSegurancaGrupoPerguntaService>(
        'inspecaoSegurancaGrupoPerguntaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaGrupoPergunta', actionType: 'update' }
  );
