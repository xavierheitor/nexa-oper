/**
 * Server Action para Criação de Contratos
 *
 * Esta action implementa a criação de contratos através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Auditoria automática
 * - Tratamento de erros
 * - Logging de operações
 *
 * COMO USAR:
 * ```typescript
 * const result = await createContrato({
 *   nome: 'Contrato Teste',
 *   numero: 'CT001',
 *   dataInicio: new Date(),
 *   dataFim: new Date()
 * });
 *
 * if (result.success) {
 *   console.log('Contrato criado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import { contratoCreateSchema } from '@/lib/schemas/contratoSchema';
import type { ContratoService } from '@/lib/services/ContratoService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo contrato
 *
 * @param rawData - Dados brutos do contrato
 * @returns Resultado da operação
 */
export const createContrato = async (rawData: unknown) =>
  handleServerAction(
    contratoCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<ContratoService>('contratoService');

      // Cria o contrato
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Contrato', actionType: 'create' }
  );
