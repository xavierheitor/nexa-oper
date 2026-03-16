'use server';

import type { AprGrupoPerguntaService } from '@/lib/services/apr/AprGrupoPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprGrupoPerguntaFilterSchema } from '../../schemas/aprGrupoPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

export const listAprGruposPergunta = async (rawData: unknown) =>
  handleServerAction(
    aprGrupoPerguntaFilterSchema,
    async (validatedData, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprGrupoPerguntaService>('aprGrupoPerguntaService');
      return service.list(validatedData);
    },
    rawData,
    {
      entityName: 'AprGrupoPergunta',
      actionType: 'list',
    }
  );
