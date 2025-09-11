/**
 * Server Action para Exclusão de Tipos de Equipe
 *
 * Esta action implementa a exclusão lógica (soft delete) de tipos
 * de equipe com auditoria completa e validação de permissões.
 *
 * FUNCIONALIDADES:
 * - Soft delete (marca como excluído sem remover do banco)
 * - Validação do ID do tipo
 * - Autenticação obrigatória
 * - Auditoria automática (deletedBy, deletedAt)
 * - Preserva histórico para auditoria
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await deleteTipoEquipe({
 *   id: 1
 * });
 *
 * if (result.success) {
 *   console.log('Tipo excluído:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { TipoEquipeService } from '@/lib/services/TipoEquipeService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID do tipo a ser excluído
const deleteTipoEquipeSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Exclui um tipo de equipe (soft delete)
 *
 * @param rawData - Objeto contendo o ID do tipo a ser excluído
 * @returns Resultado da operação com o tipo marcado como excluído
 */
export const deleteTipoEquipe = async (rawData: unknown) =>
  handleServerAction(
    deleteTipoEquipeSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<TipoEquipeService>('tipoEquipeService');

      // Realiza soft delete com auditoria automática
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'TipoEquipe', actionType: 'delete' }
  );

