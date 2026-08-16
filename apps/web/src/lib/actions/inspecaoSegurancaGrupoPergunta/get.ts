'use server';

import type { InspecaoSegurancaGrupoPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaGetSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaGruposPermission } from '../common/permissionGuard';

export const getInspecaoSegurancaGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaGetSchema,
    async ({ id }, session) => {
      requireInspecaoSegurancaGruposPermission(session);
      const service = container.get<InspecaoSegurancaGrupoPerguntaService>(
        'inspecaoSegurancaGrupoPerguntaService'
      );
      return service.getById(id);
    },
    rawData,
    { entityName: 'InspecaoSegurancaGrupoPergunta', actionType: 'get' }
  );
