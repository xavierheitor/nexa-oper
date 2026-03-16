/**
 * Server Action para Criação de Equipes
 */

'use server';

import type { EquipeService } from '@/lib/services/infraestrutura/EquipeService';
import { container } from '@/lib/services/common/registerServices';
import { equipeCreateSchema } from '../../schemas/equipeSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireCreateTeamsPermission } from '../common/permissionGuard';

export const createEquipe = async (rawData: unknown) =>
  handleServerAction(
    equipeCreateSchema,
    async (data, session) => {
      requireCreateTeamsPermission(session);

      const service = container.get<EquipeService>('equipeService');
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Equipe', actionType: 'create' }
  );
