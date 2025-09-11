// apps/web/src/lib/actions/eletricista/delete.ts

/**
 * Server Action para Exclusão de Eletricistas
 *
 * Esta action implementa a exclusão de eletricistas existentes
 * com auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (incluindo ID obrigatório)
 * - Autenticação obrigatória
 * - Auditoria automática (deletedBy, deletedAt)
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await deleteEletricista({
 *   id: 1
 * });
 * ```
 */

'use server';

import { z } from 'zod';
import { EletricistaService } from '../../services/EletricistaService';
import { container } from '../../services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

const eletricistaDeleteSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Exclui um eletricista existente
 * @param rawData - Dados do eletricista a ser excluído
 * @returns Resultado da operação com o eletricista excluído
 */
export const deleteEletricista = async (rawData: unknown) =>
  handleServerAction(
    eletricistaDeleteSchema,
    async (data, session) => {
      const service = container.get<EletricistaService>('eletricistaService');
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'delete' }
  );
