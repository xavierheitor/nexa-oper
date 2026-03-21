'use server';

import type { ProjetoProgramacaoService } from '@/lib/services/projetos/ProjetoProgramacaoService';
import { container } from '@/lib/services/common/registerServices';
import { projetoProgramacaoUpdateSchema } from '../../schemas/projetoProgramacaoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const updateProjetoProgramacao = async (rawData: unknown) =>
  handleServerAction(
    projetoProgramacaoUpdateSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjetoProgramacaoService>(
        'projetoProgramacaoService'
      );
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjetoProgramacao', actionType: 'update' }
  );
