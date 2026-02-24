'use server';

import type { AtividadeFormTemplateService } from '@/lib/services/catalogo/AtividadeFormTemplateService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const schema = z.object({ id: z.number().int().positive() });

export const deleteAtividadeFormTemplate = async (rawData: unknown) =>
  handleServerAction(
    schema,
    async (data, session) => {
      const service = container.get<AtividadeFormTemplateService>(
        'atividadeFormTemplateService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'AtividadeFormTemplate', actionType: 'delete' }
  );
