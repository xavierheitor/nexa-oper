'use server';

import type { AtividadeFormTemplateService } from '@/lib/services/catalogo/AtividadeFormTemplateService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormTemplateUpdateSchema } from '../../schemas/atividadeFormTemplateSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateAtividadeFormTemplate = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormTemplateUpdateSchema,
    async (data, session) => {
      const service = container.get<AtividadeFormTemplateService>(
        'atividadeFormTemplateService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'AtividadeFormTemplate', actionType: 'update' }
  );
