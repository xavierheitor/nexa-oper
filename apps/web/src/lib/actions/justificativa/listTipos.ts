/**
 * Server Action para listar tipos de justificativa
 * Acessa o banco diretamente via Prisma (não chama API)
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { container } from '../../services/common/registerServices';
import type { TipoJustificativaService } from '../../services/TipoJustificativaService';
import { z } from 'zod';

/**
 * Lista todos os tipos de justificativa disponíveis (para selects/dropdowns)
 */
export const listTiposJustificativa = async () =>
  handleServerAction(
    z.object({}),
    async () => {
      const service = container.get<TipoJustificativaService>('tipoJustificativaService');
      return service.listAll(true); // Apenas tipos ativos
    },
    {},
    { entityName: 'TipoJustificativa', actionType: 'list' }
  );
