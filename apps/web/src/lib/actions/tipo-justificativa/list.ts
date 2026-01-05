/**
 * Server Action para listar tipos de justificativa
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/justificativas/TipoJustificativaService';
import { listarTiposJustificativaSchema } from '../../schemas/tipoJustificativaSchema';
import { z } from 'zod';

/**
 * Lista tipos de justificativa com paginação
 */
export const listTiposJustificativa = async (rawData: unknown) =>
  handleServerAction(
    listarTiposJustificativaSchema,
    async (data) => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'TipoJustificativa', actionType: 'list' }
  );

/**
 * Lista todos os tipos de justificativa (para selects/dropdowns)
 */
export const listAllTiposJustificativa = async (ativo?: boolean) =>
  handleServerAction(
    z.object({ ativo: z.boolean().optional() }),
    async (data) => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.listAll(data.ativo);
    },
    { ativo },
    { entityName: 'TipoJustificativa', actionType: 'list' }
  );

