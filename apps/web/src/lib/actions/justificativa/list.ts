/**
 * Server Action para listar justificativas individuais
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { JustificativaService } from '../../services/justificativas/JustificativaService';
import { listarJustificativasSchema } from '../../schemas/justificativaSchema';
import type { PaginationParams } from '../../types/common';

/**
 * Lista justificativas individuais com filtros e paginação
 */
export const listJustificativas = async (rawData: unknown) =>
  handleServerAction(
    listarJustificativasSchema,
    async (data) => {
      const service = container.get<JustificativaService>('justificativaService');

      // Converte datas de string para Date se necessário e adiciona orderBy/orderDir
      const filterParams: PaginationParams & {
        eletricistaId?: number;
        equipeId?: number;
        status?: 'pendente' | 'aprovada' | 'rejeitada';
        dataInicio?: Date;
        dataFim?: Date;
      } = {
        page: data.page,
        pageSize: data.pageSize,
        orderBy: 'createdAt',
        orderDir: 'desc',
        ...(data.eletricistaId && { eletricistaId: data.eletricistaId }),
        ...(data.equipeId && { equipeId: data.equipeId }),
        ...(data.status && { status: data.status }),
        ...(data.dataInicio && { dataInicio: new Date(data.dataInicio) }),
        ...(data.dataFim && { dataFim: new Date(data.dataFim) }),
      };

      return service.list(filterParams);
    },
    rawData,
    { entityName: 'Justificativa', actionType: 'list' }
  );

