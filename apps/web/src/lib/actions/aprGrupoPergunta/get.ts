'use server';

import type { AprGrupoPerguntaService } from '@/lib/services/apr/AprGrupoPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

const getAprGrupoPerguntaSchema = z.object({
  id: z.number().int().positive('ID deve ser um número positivo'),
});

export const getAprGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    getAprGrupoPerguntaSchema,
    async (validatedData, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprGrupoPerguntaService>('aprGrupoPerguntaService');
      return service.getById(validatedData.id);
    },
    rawData,
    {
      entityName: 'AprGrupoPergunta',
      actionType: 'get',
    }
  );
