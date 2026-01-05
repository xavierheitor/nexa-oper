/**
 * Server Action para Busca de Tipo de Equipe por ID
 *
 * Esta action implementa a busca de um tipo de equipe específico
 * por ID, com validação e tratamento de erros.
 *
 * FUNCIONALIDADES:
 * - Validação do ID do tipo
 * - Busca por ID único
 * - Retorna null se não encontrado
 * - Ignora registros com soft delete
 * - Tratamento de erros
 * - Não requer autenticação (apenas leitura)
 *
 * COMO USAR:
 * ```typescript
 * const result = await getTipoEquipe({
 *   id: 1
 * });
 *
 * if (result.success && result.data) {
 *   console.log('Tipo encontrado:', result.data);
 * } else {
 *   console.log('Tipo não encontrado');
 * }
 * ```
 */

'use server';

import type { TipoEquipeService } from '@/lib/services/infraestrutura/TipoEquipeService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID do tipo a ser buscado
const getTipoEquipeSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Busca um tipo de equipe por ID
 *
 * @param rawData - Objeto contendo o ID do tipo a ser buscado
 * @returns Resultado da operação com o tipo encontrado ou null
 */
export const getTipoEquipe = async (rawData: unknown) =>
  handleServerAction(
    getTipoEquipeSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<TipoEquipeService>('tipoEquipeService');

      // Busca o tipo por ID (retorna null se não encontrado)
      return service.getById(data.id);
    },
    rawData,
    { entityName: 'TipoEquipe', actionType: 'get' }
  );

