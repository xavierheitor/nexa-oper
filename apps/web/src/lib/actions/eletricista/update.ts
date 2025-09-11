// apps/web/src/lib/actions/eletricista/update.ts

/**
 * Server Action para Atualização de Eletricistas
 *
 * Esta action implementa a atualização de eletricistas existentes
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
 * const result = await updateEletricista({
 *   id: 1,
 *   nome: 'João da Silva' // Apenas campos que mudaram
 * });
 *
 * if (result.success) {
 *   console.log('Eletricista atualizado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import { eletricistaUpdateSchema } from '../../schemas/eletricistaSchema';
import { EletricistaService } from '../../services/EletricistaService';
import { container } from '../../services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um eletricista existente
 * @param rawData - Dados do eletricista a ser atualizado
 * @returns Resultado da operação com o eletricista atualizado
 */
export const updateEletricista = async (rawData: unknown) =>
  handleServerAction(
    eletricistaUpdateSchema,
    async (data, session) => {
      const service = container.get<EletricistaService>('eletricistaService');
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'update' }
  );
