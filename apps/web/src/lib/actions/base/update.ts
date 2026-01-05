/**
 * Server Action para Atualização de Bases
 *
 * Esta action implementa a atualização de bases através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (id, nome e contratoId)
 * - Autenticação obrigatória
 * - Auditoria automática (updatedBy, updatedAt)
 * - Tratamento de erros
 * - Logging de operações
 *
 * COMO USAR:
 * ```typescript
 * const result = await updateBase({
 *   id: 1,
 *   nome: 'Base Aparecida Atualizada',
 *   contratoId: 1
 * });
 *
 * if (result.success) {
 *   console.log('Base atualizada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { BaseService } from '@/lib/services/infraestrutura/BaseService';
import { container } from '@/lib/services/common/registerServices';
import { baseUpdateSchema } from '../../schemas/baseSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza uma base existente
 *
 * @param rawData - Dados brutos da base (id, nome, contratoId)
 * @returns Resultado da operação com a base atualizada
 */
export const updateBase = async (rawData: unknown) =>
  handleServerAction(
    baseUpdateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<BaseService>('baseService');

      // Atualiza a base com auditoria automática
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Base', actionType: 'update' }
  );
