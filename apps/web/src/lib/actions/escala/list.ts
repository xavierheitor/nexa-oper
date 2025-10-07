// apps/web/src/lib/actions/escala/list.ts

/**
 * Server Action para Listagem de Escalas
 *
 * Encapsula a chamada ao serviço de Escala aplicando validação de filtros,
 * autenticação e logging padronizado. Retorna resultado paginado compatível
 * com os hooks de tabela da aplicação.
 */

'use server';

import {
  EscalaFilter,
  escalaFilterSchema,
} from '../../schemas/escalaSchema';
import { container } from '../../services/common/registerServices';
import { EscalaService } from '../../services/EscalaService';
import { handleServerAction } from '../common/actionHandler';

export const listEscalas = async (rawData: unknown) =>
  handleServerAction<EscalaFilter, Awaited<ReturnType<EscalaService['list']>>>(
    escalaFilterSchema,
    async (data, _session) => {
      const service = container.get<EscalaService>('escalaService');
      return service.list(data);
    },
    rawData,
    { entityName: 'Escala', actionType: 'list' }
  );
