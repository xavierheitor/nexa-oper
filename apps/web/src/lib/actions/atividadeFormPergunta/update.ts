'use server';

import type { AtividadeFormPerguntaService } from '@/lib/services/catalogo/AtividadeFormPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormPerguntaUpdateSchema } from '../../schemas/atividadeFormPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateAtividadeFormPergunta = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormPerguntaUpdateSchema,
    async (data, session) => {
      const service = container.get<AtividadeFormPerguntaService>(
        'atividadeFormPerguntaService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'AtividadeFormPergunta', actionType: 'update' }
  );
