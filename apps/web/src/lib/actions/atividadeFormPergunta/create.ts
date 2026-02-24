'use server';

import type { AtividadeFormPerguntaService } from '@/lib/services/catalogo/AtividadeFormPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormPerguntaCreateSchema } from '../../schemas/atividadeFormPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const createAtividadeFormPergunta = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormPerguntaCreateSchema,
    async (data, session) => {
      const service = container.get<AtividadeFormPerguntaService>(
        'atividadeFormPerguntaService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'AtividadeFormPergunta', actionType: 'create' }
  );
