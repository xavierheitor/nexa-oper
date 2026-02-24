'use server';

import type { AtividadeFormTemplateService } from '@/lib/services/catalogo/AtividadeFormTemplateService';
import { container } from '@/lib/services/common/registerServices';
import { atividadeFormTemplateFilterSchema } from '../../schemas/atividadeFormTemplateSchema';
import { handleServerAction } from '../common/actionHandler';

export const listAtividadeFormTemplates = async (rawData: unknown) =>
  handleServerAction(
    atividadeFormTemplateFilterSchema,
    async (data) => {
      const service = container.get<AtividadeFormTemplateService>(
        'atividadeFormTemplateService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'AtividadeFormTemplate', actionType: 'list' }
  );
