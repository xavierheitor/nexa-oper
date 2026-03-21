'use server';

import type { ProjetoProgramacaoService } from '@/lib/services/projetos/ProjetoProgramacaoService';
import { container } from '@/lib/services/common/registerServices';
import { projetoProgramacaoCreateSchema } from '../../schemas/projetoProgramacaoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const createProjetoProgramacao = async (rawData: unknown) =>
  handleServerAction(
    projetoProgramacaoCreateSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjetoProgramacaoService>(
        'projetoProgramacaoService'
      );
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'ProjetoProgramacao', actionType: 'create' }
  );
