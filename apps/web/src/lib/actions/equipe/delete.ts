/**
 * Server Action para Exclusão de Equipes
 */

'use server';

import type { EquipeService } from '@/lib/services/infraestrutura/EquipeService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const deleteEquipeSchema = z.object({ id: z.number().int().positive() });

export const deleteEquipe = async (rawData: unknown) =>
  handleServerAction(
    deleteEquipeSchema,
    async (data, session) => {
      const service = container.get<EquipeService>('equipeService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Equipe', actionType: 'delete' }
  );

