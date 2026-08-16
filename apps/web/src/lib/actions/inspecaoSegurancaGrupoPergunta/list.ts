'use server';

import type { InspecaoSegurancaGrupoPerguntaService } from '@/lib/services/inspecao-seguranca/InspecaoSegurancaServices';
import { container } from '@/lib/services/common/registerServices';
import { inspecaoSegurancaFilterSchema } from '../../schemas/inspecaoSegurancaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireInspecaoSegurancaGruposPermission } from '../common/permissionGuard';

export const listInspecaoSegurancaGruposPergunta = async (rawData: unknown) =>
  handleServerAction(
    inspecaoSegurancaFilterSchema,
    async (params, session) => {
      requireInspecaoSegurancaGruposPermission(session);
      const service = container.get<InspecaoSegurancaGrupoPerguntaService>(
        'inspecaoSegurancaGrupoPerguntaService'
      );
      return service.list(params);
    },
    rawData,
    { entityName: 'InspecaoSegurancaGrupoPergunta', actionType: 'list' }
  );
