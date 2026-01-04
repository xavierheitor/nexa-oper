/**
 * Server Action para Exclusão de Bases
 *
 * Esta action implementa a exclusão de bases através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação do ID da base
 * - Autenticação obrigatória
 * - Soft delete com auditoria (deletedBy, deletedAt)
 * - Tratamento de erros
 * - Logging de operações
 *
 * COMO USAR:
 * ```typescript
 * const result = await deleteBase({ id: 1 });
 *
 * if (result.success) {
 *   console.log('Base excluída com sucesso');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { BaseService } from '@/lib/services/infraestrutura/BaseService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID da base a ser excluída
const deleteBaseSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Exclui uma base
 *
 * @param rawData - Objeto contendo o ID da base a ser excluída
 * @returns Resultado da operação
 */
export const deleteBase = async (rawData: unknown) =>
  handleServerAction(
    deleteBaseSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<BaseService>('baseService');

      // Exclui a base com auditoria automática
      return service.delete(data.id, session.user.id);
    },
    rawData,
    { entityName: 'Base', actionType: 'delete' }
  );
