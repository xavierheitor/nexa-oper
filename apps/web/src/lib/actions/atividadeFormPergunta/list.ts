'use server';

import type { AtividadeFormPerguntaService } from '@/lib/services/catalogo/AtividadeFormPerguntaService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormPerguntaFilterSchema } from '../../schemas/atividadeFormPerguntaSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireFormulariosAtividadePerguntaPermission } from '../common/permissionGuard';

export const listAtividadeFormPerguntas = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormPerguntaFilterSchema,
    async (data, session) => {
      requireFormulariosAtividadePerguntaPermission(session);
      const service = container.get<AtividadeFormPerguntaService>(
        'atividadeFormPerguntaService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'AtividadeFormPergunta', actionType: 'list' }
  );
