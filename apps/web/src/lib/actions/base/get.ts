/**
 * Server Action para Busca de Base por ID
 *
 * Esta action implementa a busca de uma base específica
 * por ID, com validação e tratamento de erros.
 *
 * FUNCIONALIDADES:
 * - Validação do ID da base
 * - Busca por ID único
 * - Retorna null se não encontrado
 * - Ignora registros com soft delete
 * - Tratamento de erros
 * - Não requer autenticação (apenas leitura)
 *
 * COMO USAR:
 * ```typescript
 * const result = await getBase({ id: 1 });
 *
 * if (result.success && result.data) {
 *   console.log('Base encontrada:', result.data);
 * } else {
 *   console.log('Base não encontrada');
 * }
 * ```
 */

'use server';

import type { BaseService } from '@/lib/services/BaseService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID da base a ser buscada
const getBaseSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Busca uma base por ID
 *
 * @param rawData - Objeto contendo o ID da base a ser buscada
 * @returns Resultado da operação com a base encontrada ou null
 */
export const getBase = async (rawData: unknown) =>
  handleServerAction(
    getBaseSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<BaseService>('baseService');

      // Busca a base por ID (retorna null se não encontrada)
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'Base', actionType: 'get' }
  );
