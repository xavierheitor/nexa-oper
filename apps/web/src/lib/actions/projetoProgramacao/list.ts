'use server';

import type { ProjetoProgramacaoService } from '@/lib/services/projetos/ProjetoProgramacaoService';
import { container } from '@/lib/services/common/registerServices';
import { projetoProgramacaoFilterSchema } from '../../schemas/projetoProgramacaoSchema';
import { handleServerAction } from '../common/actionHandler';
import { requireProjectsPermission } from '../common/permissionGuard';

export const listProjetoProgramacoes = async (rawData: unknown) =>
  handleServerAction(
    projetoProgramacaoFilterSchema,
    async (data, session) => {
      requireProjectsPermission(session);
      const service = container.get<ProjetoProgramacaoService>(
        'projetoProgramacaoService'
      );
      return service.list(data);
    },
    rawData,
    { entityName: 'ProjetoProgramacao', actionType: 'list' }
  );
