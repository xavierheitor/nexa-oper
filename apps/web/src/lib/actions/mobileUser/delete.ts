/**
 * Server Action para Exclusão de Usuários Móveis
 *
 * Esta action implementa a exclusão (soft delete) de usuários móveis
 * através de Server Actions do Next.js, preservando dados para
 * auditoria e mantendo integridade referencial.
 *
 * FUNCIONALIDADES:
 * - Soft delete para preservar histórico
 * - Validação de existência do usuário
 * - Auditoria completa da operação
 * - Verificação de dependências (futuro)
 * - Logging detalhado da exclusão
 * - Tratamento de erros padronizado
 *
 * COMPORTAMENTO:
 * - Não remove fisicamente o registro
 * - Marca como excluído com timestamp
 * - Registra quem executou a exclusão
 * - Preserva dados para auditoria
 * - Exclui da listagem ativa
 *
 * VALIDAÇÕES:
 * - Usuário móvel deve existir
 * - Usuário não deve estar já excluído
 * - Verificação de sessões ativas (futuro)
 * - Validação de permissões
 *
 * SEGURANÇA:
 * - Apenas usuários autenticados podem excluir
 * - Operação irreversível via interface
 * - Auditoria completa da ação
 * - Logs detalhados para compliance
 *
 * COMO USAR:
 * ```typescript
 * // Exclusão simples
 * const result = await deleteMobileUser({ id: 1 });
 * 
 * if (result.success) {
 *   console.log("Usuário móvel excluído com sucesso");
 * }
 * ```
 *
 * @param rawData - Dados contendo ID do usuário móvel a ser excluído
 * @returns Resultado da operação de exclusão
 */

'use server';

import type { MobileUserService } from '@/lib/services/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação dos dados de exclusão
const deleteMobileUserSchema = z.object({
  id: z.number().int().positive('ID do usuário móvel é obrigatório'),
});

/**
 * Exclui um usuário móvel (soft delete)
 *
 * Marca o usuário como excluído preservando dados para auditoria
 * e mantendo integridade referencial com outros registros.
 *
 * @param rawData - Dados contendo ID do usuário móvel
 * @returns Resultado da operação de exclusão
 */
export const deleteMobileUser = async (rawData: unknown) =>
  handleServerAction(
    deleteMobileUserSchema,
    async (data, session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Exclui o usuário móvel
      await service.delete(data.id, session.user.id);

      // Retorna confirmação de sucesso
      return { id: data.id, deleted: true };
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'delete' }
  );
