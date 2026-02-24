'use server';

import type { AprGrupoPerguntaService } from '@/lib/services/apr/AprGrupoPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprGrupoPerguntaCreateSchema } from '../../schemas/aprGrupoPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const createAprGrupoPergunta = async (rawData: unknown) =>
  handleServerAction(
    aprGrupoPerguntaCreateSchema,
    async (validatedData, session) => {
      const service = container.get<AprGrupoPerguntaService>('aprGrupoPerguntaService');
      return service.create(validatedData, session.user.id);
    },
    rawData,
    {
      entityName: 'AprGrupoPergunta',
      actionType: 'create',
    }
  );
