/**
 * Server Action para Listagem de Equipes
 */

'use server';

import type { EquipeService } from '@/lib/services/infraestrutura/EquipeService';
import { container } from '@/lib/services/common/registerServices';
import { equipeFilterSchema } from '../../schemas/equipeSchema';
import { handleServerAction } from '../common/actionHandler';

export const listEquipes = async (rawData: unknown) =>
  handleServerAction(
    equipeFilterSchema,
    async data => {
      const service = container.get<EquipeService>('equipeService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Equipe', actionType: 'list' }
  );

