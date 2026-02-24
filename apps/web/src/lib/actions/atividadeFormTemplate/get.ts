'use server';

import type { AtividadeFormTemplateService } from '@/lib/services/catalogo/AtividadeFormTemplateService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const getAtividadeFormTemplate = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data) => {
      const service = container.get<AtividadeFormTemplateService>(
        'atividadeFormTemplateService'
      );
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'AtividadeFormTemplate', actionType: 'get' }
  );
