// apps/web/src/lib/actions/eletricista/create.ts

/**
 * Server Action para Criação de Eletricistas
 *
 * Esta action implementa a criação de eletricistas através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Auditoria automática (createdBy, createdAt)
 * - Tratamento de erros
 * - Logging de operações
 *
 * COMO USAR:
 * ```typescript
 * const result = await createEletricista({
 *   nome: 'João da Silva',
 *   matricula: '123456',
 *   telefone: '1234567890',
 *   contratoId: 1
 * });
 * ```
 */

'use server';

import { eletricistaCreateSchema } from '@/lib/schemas/eletricistaSchema';
import type { EletricistaService } from '@/lib/services/EletricistaService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo eletricista
 *
 * @param rawData - Dados brutos do eletricista
 * @returns Resultado da operação com o eletricista criado
 */
export const createEletricista = async (rawData: unknown) =>
  handleServerAction(
    eletricistaCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<EletricistaService>('eletricistaService');

      // Cria o eletricista com auditoria automática
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'create' }
  );
