'use server';

import type { AtividadeFormTemplateService } from '@/lib/services/catalogo/AtividadeFormTemplateService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormTemplateCreateSchema } from '../../schemas/atividadeFormTemplateSchema';
import { handleServerAction } from '../common/actionHandler';

export const createAtividadeFormTemplate = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormTemplateCreateSchema,
    async (data, session) => {
      const service = container.get<AtividadeFormTemplateService>(
        'atividadeFormTemplateService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'AtividadeFormTemplate', actionType: 'create' }
  );
