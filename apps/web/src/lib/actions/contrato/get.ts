/**
 * Server Action para Busca de Contrato por ID
 *
 * Esta action implementa a busca de um contrato específico através
 * de Server Actions do Next.js, incluindo validação do ID,
 * autenticação e logging automático.
 *
 * FUNCIONALIDADES:
 * - Validação de ID numérico positivo
 * - Autenticação obrigatória
 * - Busca por ID único
 * - Tratamento de contrato não encontrado
 * - Logging automático da operação
 *
 * COMO FUNCIONA:
 * 1. Valida se o ID é um número inteiro positivo
 * 2. Verifica autenticação do usuário
 * 3. Busca o contrato no banco de dados
 * 4. Retorna o contrato ou null se não encontrado
 * 5. Registra a operação nos logs
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Buscar contrato por ID
 * const result = await getContrato({ id: 123 });
 *
 * if (result.success && result.data) {
 *   console.log('Contrato encontrado:', result.data);
 * } else if (result.success && !result.data) {
 *   console.log('Contrato não encontrado');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 *
 * // Uso em componente React
 * const handleGetContrato = async (id: number) => {
 *   const result = await getContrato({ id });
 *   if (result.success) {
 *     setContrato(result.data);
 *   }
 * };
 * ```
 */

'use server';

import type { ContratoService } from '@/lib/services/ContratoService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema de validação para ID do contrato
const idSchema = z.object({
  id: z.number().int().positive('ID deve ser um número inteiro positivo'),
});

/**
 * Busca um contrato por ID
 *
 * @param rawData - Dados brutos contendo o ID do contrato
 * @returns Resultado da operação com o contrato encontrado ou null
 */
export const getContrato = (rawData: unknown) =>
  handleServerAction(
    idSchema,
    async ({ id }) => {
      // Obtém o serviço do container
      const service = container.get<ContratoService>('contratoService');

      // Busca o contrato por ID
      return service.getById(id);
    },
    rawData,
    { entityName: 'Contrato', actionType: 'get' }
  );
