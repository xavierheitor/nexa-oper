/**
 * Server Action para Criação de Bases
 *
 * Esta action implementa a criação de bases através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (nome e contratoId obrigatórios)
 * - Autenticação obrigatória
 * - Auditoria automática (createdBy, createdAt)
 * - Tratamento de erros
 * - Logging de operações
 *
 * COMO USAR:
 * ```typescript
 * const result = await createBase({
 *   nome: 'Base Aparecida',
 *   contratoId: 1
 * });
 *
 * if (result.success) {
 *   console.log('Base criada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { BaseService } from '@/lib/services/BaseService';
import { container } from '@/lib/services/common/registerServices';
import { baseCreateSchema } from '../../schemas/baseSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria uma nova base
 *
 * @param rawData - Dados brutos da base (nome, contratoId)
 * @returns Resultado da operação com a base criada
 */
export const createBase = async (rawData: unknown) =>
  handleServerAction(
    baseCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<BaseService>('baseService');

      // Cria a base com auditoria automática
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Base', actionType: 'create' }
  );
