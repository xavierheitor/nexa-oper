'use server';

import type { AprGrupoPerguntaService } from '@/lib/services/apr/AprGrupoPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprGrupoPerguntaUpdateSchema } from '../../schemas/aprGrupoPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateAprGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    aprGrupoPerguntaUpdateSchema,
    async (validatedData, session) => {
      const service = container.get<AprGrupoPerguntaService>('aprGrupoPerguntaService');
      return service.update(validatedData, session.user.id);
    },
    rawData,
    {
      entityName: 'AprGrupoPergunta',
      actionType: 'update',
    }
  );
