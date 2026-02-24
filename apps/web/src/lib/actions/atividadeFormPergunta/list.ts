'use server';

import type { AtividadeFormPerguntaService } from '@/lib/services/catalogo/AtividadeFormPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormPerguntaFilterSchema } from '../../schemas/atividadeFormPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const listAtividadeFormPerguntas = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormPerguntaFilterSchema,
    async (data) => {
      const service = container.get<AtividadeFormPerguntaService>(
        'atividadeFormPerguntaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'AtividadeFormPergunta', actionType: 'list' }
  );
