'use server';

import type { InspecaoSegurancaGrupoPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaDeleteSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaGruposPermission } from '../common/permissionGuard';

export const deleteInspecaoSegurancaGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaDeleteSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaGruposPermission(session);
      const service = container.get<InspecaoSegurancaGrupoPerguntaService>(
        'inspecaoSegurancaGrupoPerguntaService'
      );
      return service.delete(id, session.user.id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaGrupoPergunta', actionType: 'delete' }
  );
