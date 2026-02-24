'use server';

import type { AtividadeFormPerguntaService } from '@/lib/services/catalogo/AtividadeFormPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteAtividadeFormPergunta = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<AtividadeFormPerguntaService>(
        'atividadeFormPerguntaService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'AtividadeFormPergunta', actionType: 'delete' }
  );
