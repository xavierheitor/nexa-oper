/**
 * Server Action para Alteração de Senha de Usuários Web
 *
 * Esta action implementa a alteração de senha de usuários web
 * através de Server Actions do Next.js, incluindo validação
 * da senha atual, hash da nova senha e auditoria.
 *
 * FUNCIONALIDADES:
 * - Validação da senha atual
 * - Validação de nova senha forte
 * - Confirmação da nova senha
 * - Hash seguro da nova senha
 * - Verificação de diferença entre senhas
 * - Auditoria automática (updatedBy, updatedAt)
 * - Tratamento de erros específicos
 *
 * SEGURANÇA:
 * - Verificação obrigatória da senha atual
 * - Nova senha deve ser diferente da atual
 * - Hash seguro com bcrypt
 * - Validação de senha forte
 * - Auditoria completa
 *
 * COMO USAR:
 * ```typescript
 * const result = await changeUserPassword({
 *   id: 1,
 *   currentPassword: 'senhaAtual123',
 *   newPassword: 'NovaSen@123',
 *   confirmNewPassword: 'NovaSen@123'
 * });
 * 
 * if (result.success) {
 *   console.log('Senha alterada com sucesso');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 *
 * @param rawData - Dados de alteração de senha
 * @returns Resultado da operação com o usuário atualizado (sem senha)
 */

'use server';

import type { UserService } from '@/lib/services/UserService';
import { container } from '@/lib/services/common/registerServices';
import { userChangePasswordSchema } from '../../schemas/userSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Altera a senha de um usuário web
 *
 * Verifica a senha atual, valida a nova senha e
 * atualiza com hash seguro.
 *
 * @param rawData - Dados de alteração de senha incluindo senha atual
 * @returns Resultado da operação com o usuário atualizado (sem senha)
 */
export const changeUserPassword = async (rawData: unknown) =>
  handleServerAction(
    userChangePasswordSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Altera a senha com verificação da senha atual
      const user = await service.changePassword(data, session.user.id);

      return user;
    },
    rawData,
    { entityName: 'User', actionType: 'changePassword' }
  );
