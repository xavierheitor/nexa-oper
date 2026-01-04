/**
 * Server Action para Atualização de Equipes
 */

'use server';

import type { EquipeService } from '@/lib/services/infraestrutura/EquipeService';
import { container } from '@/lib/services/common/registerServices';
import { equipeUpdateSchema } from '../../schemas/equipeSchema';
import { handleServerAction } from '../common/actionHandler';

export const updateEquipe = async (rawData: unknown) =>
  handleServerAction(
    equipeUpdateSchema,
    async (data, session) => {
      const service = container.get<EquipeService>('equipeService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Equipe', actionType: 'update' }
  );

