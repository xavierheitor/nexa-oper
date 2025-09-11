/**
 * Server Action para Exclusão de Usuários Web
 *
 * Esta action implementa a exclusão (soft delete) de usuários web
 * através de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Soft delete com auditoria
 * - Autenticação obrigatória
 * - Verificação de existência do usuário
 * - Proteção contra auto-exclusão
 * - Auditoria automática (deletedBy, deletedAt)
 * - Tratamento de erros específicos
 * - Logging de operações
 *
 * SEGURANÇA:
 * - Usuários não podem excluir a si mesmos
 * - Soft delete para preservar auditoria
 * - Verificação de existência antes da exclusão
 * - Auditoria completa
 *
 * COMO USAR:
 * ```typescript
 * const result = await deleteUser({ id: 1 });
 * 
 * if (result.success) {
 *   console.log('Usuário excluído:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 *
 * @param rawData - Dados com ID do usuário a ser excluído
 * @returns Resultado da operação com o usuário excluído
 */

'use server';

import type { UserService } from '@/lib/services/UserService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID
const deleteUserSchema = z.object({
  id: z.number().int().positive('ID deve ser um número inteiro positivo'),
});

/**
 * Exclui um usuário web (soft delete)
 *
 * Marca o usuário como excluído sem remover fisicamente
 * do banco de dados, preservando a auditoria.
 *
 * @param rawData - Dados com ID do usuário a ser excluído
 * @returns Resultado da operação com o usuário excluído
 */
export const deleteUser = async (rawData: unknown) =>
  handleServerAction(
    deleteUserSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Exclui o usuário com proteção e auditoria automática
      const user = await service.delete(data.id, session.user.id);

      return user;
    },
    rawData,
    { entityName: 'User', actionType: 'delete' }
  );
