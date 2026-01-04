/**
 * Server Action para Atualização de Tipos de Equipe
 *
 * Esta action implementa a atualização de tipos de equipe existentes
 * com validação completa e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (incluindo ID obrigatório)
 * - Autenticação obrigatória
 * - Auditoria automática (updatedBy, updatedAt)
 * - Atualização parcial (apenas campos enviados)
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await updateTipoEquipe({
 *   id: 1,
 *   nome: 'Linha Morta' // Apenas campos que mudaram
 * });
 *
 * if (result.success) {
 *   console.log('Tipo atualizado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { TipoEquipeService } from '@/lib/services/infraestrutura/TipoEquipeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoEquipeUpdateSchema } from '../../schemas/tipoEquipeSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um tipo de equipe existente
 *
 * @param rawData - Dados do tipo incluindo ID obrigatório e campos a atualizar
 * @returns Resultado da operação com o tipo atualizado
 */
export const updateTipoEquipe = async (rawData: unknown) =>
  handleServerAction(
    tipoEquipeUpdateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<TipoEquipeService>('tipoEquipeService');

      // Atualiza o tipo com auditoria automática
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoEquipe', actionType: 'update' }
  );

