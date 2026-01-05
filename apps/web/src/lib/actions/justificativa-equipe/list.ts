/**
 * Server Action para listar justificativas de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaEquipeService } from '../../services/justificativas/JustificativaEquipeService';
import { listarJustificativasEquipeSchema } from '../../schemas/justificativaEquipeSchema';
import type { PaginationParams } from '../../types/common';

/**
 * Lista justificativas de equipe com filtros e paginação
 */
export const listJustificativasEquipe = async (rawData: unknown) =>
  handleServerAction(
    listarJustificativasEquipeSchema,
    async data => {
      const service = container.get<JustificativaEquipeService>(
        'justificativaEquipeService'
      );

      // Converte datas de string para Date se necessário e adiciona orderBy/orderDir
      const filterParams: PaginationParams & {
        equipeId?: number;
        status?: 'pendente' | 'aprovada' | 'rejeitada';
        dataInicio?: Date;
        dataFim?: Date;
      } = {
        page: data.page,
        pageSize: data.pageSize,
        orderBy: 'dataReferencia',
        orderDir: 'desc',
        ...(data.equipeId && { equipeId: data.equipeId }),
        ...(data.status && { status: data.status }),
        ...(data.dataInicio && { dataInicio: new Date(data.dataInicio) }),
        ...(data.dataFim && { dataFim: new Date(data.dataFim) }),
      };

      return service.list(filterParams);
    },
    rawData,
    { entityName: 'JustificativaEquipe', actionType: 'list' }
  );
