'use server';

import type { AprGrupoPerguntaService } from '@/lib/services/apr/AprGrupoPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireAprGruposPermission } from '../common/permissionGuard';

const deleteAprGrupoPerguntaSchema = z.object({
  id: z.number().int().positive('ID deve ser um número positivo'),
});

export const deleteAprGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    deleteAprGrupoPerguntaSchema,
    async (validatedData, session) => {
      requireAprGruposPermission(session);
      const service = container.get<AprGrupoPerguntaService>('aprGrupoPerguntaService');
      return service.delete(validatedData.id, session.user.id);
    },
    rawData,
    {
      entityName: 'AprGrupoPergunta',
      actionType: 'delete',
    }
  );
