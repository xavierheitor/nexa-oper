'use server';

import { z } from 'zod';
import type { ProjetoProgramacaoService } from '@/lib/services/projetos/ProjetoProgramacaoService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

const projetoProgramacaoDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteProjetoProgramacao = async (rawData: unknown) =>
  handleServerAction(
    projetoProgramacaoDeleteSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjetoProgramacaoService>(
        'projetoProgramacaoService'
      );
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'ProjetoProgramacao', actionType: 'delete' }
  );
