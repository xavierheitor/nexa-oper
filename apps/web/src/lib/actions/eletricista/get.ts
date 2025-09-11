// apps/web/src/lib/actions/eletricista/get.ts

/**
 * Server Action para Busca de Eletricista por ID
 *
 * Esta action implementa a busca de um eletricista específico
 * por ID, com validação e tratamento de erros.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (incluindo ID obrigatório)
 * - Busca por ID único
 * - Retorna null se não encontrado
 * - Ignora registros com soft delete
 * - Tratamento de erros
 * - Não requer autenticação (apenas leitura)
 *
 * COMO USAR:
 * ```typescript
 * const result = await getEletricista({
 *   id: 1
 * });
 * ```
 */

'use server';

import { z } from 'zod';
import { EletricistaService } from '../../services/EletricistaService';
import { container } from '../../services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

const getEletricistaSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Busca um eletricista por ID
 * @param rawData - Dados do eletricista a ser buscado
 * @returns Resultado da operação com o eletricista encontrado ou null
 */
export const getEletricista = async (rawData: unknown) =>
  handleServerAction(
    getEletricistaSchema,
    async data => {
      const service = container.get<EletricistaService>('eletricistaService');
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'get' }
  );
