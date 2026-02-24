'use server';

import type { AprGrupoPerguntaService } from '@/lib/services/apr/AprGrupoPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { aprGrupoPerguntaFilterSchema } from '../../schemas/aprGrupoPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const listAprGruposPergunta = async (rawData: unknown) =>
  handleServerAction(
    aprGrupoPerguntaFilterSchema,
    async (validatedData) => {
      const service = container.get<AprGrupoPerguntaService>('aprGrupoPerguntaService');
      return service.list(validatedData);
    },
    rawData,
    {
      entityName: 'AprGrupoPergunta',
      actionType: 'list',
    }
  );
