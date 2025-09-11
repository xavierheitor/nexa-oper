/**
 * Server Action para Alteração de Senha de Usuários Móveis
 *
 * Esta action implementa a alteração de senha de usuários móveis
 * através de Server Actions do Next.js, com validação da senha
 * atual e aplicação de critérios de segurança.
 *
 * FUNCIONALIDADES:
 * - Validação da senha atual obrigatória
 * - Critérios rigorosos para nova senha
 * - Hash seguro da nova senha com bcrypt
 * - Confirmação de senha obrigatória
 * - Auditoria automática da operação
 * - Invalidação de sessões ativas (futuro)
 *
 * VALIDAÇÕES:
 * - Usuário móvel deve existir e estar ativo
 * - Senha atual deve ser fornecida e válida
 * - Nova senha deve atender critérios de força
 * - Confirmação deve coincidir com nova senha
 * - Nova senha deve ser diferente da atual
 *
 * SEGURANÇA:
 * - Verificação obrigatória da senha atual
 * - Hash da nova senha com salt rounds altos
 * - Operação totalmente auditada
 * - Invalidação de tokens existentes (futuro)
 * - Logs detalhados para compliance
 *
 * COMPORTAMENTO:
 * - Valida senha atual antes de alterar
 * - Aplica hash na nova senha
 * - Atualiza timestamp de modificação
 * - Registra usuário que fez a alteração
 * - Pode invalidar sessões ativas (futuro)
 *
 * COMO USAR:
 * ```typescript
 * const result = await changeMobileUserPassword({
 *   id: 1,
 *   currentPassword: "OldStr0ng@Pass",
 *   newPassword: "NewStr0ng@Pass",
 *   confirmNewPassword: "NewStr0ng@Pass"
 * });
 * 
 * if (result.success) {
 *   console.log("Senha alterada com sucesso");
 * }
 * ```
 *
 * @param rawData - Dados da alteração incluindo senhas atual e nova
 * @returns Resultado da operação de alteração de senha
 */

'use server';

import type { MobileUserService } from '@/lib/services/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { mobileUserChangePasswordSchema } from '../../schemas/mobileUserSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Altera a senha de um usuário móvel
 *
 * Valida a senha atual, aplica critérios de segurança na nova senha
 * e atualiza no banco de dados com hash seguro.
 *
 * @param rawData - Dados da alteração incluindo ID e senhas
 * @returns Resultado da operação de alteração
 */
export const changeMobileUserPassword = async (rawData: unknown) =>
  handleServerAction(
    mobileUserChangePasswordSchema,
    async (data, session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Altera a senha do usuário móvel
      await service.changePassword(data, session.user.id);

      // Retorna confirmação de sucesso
      return { success: true, message: 'Senha alterada com sucesso' };
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'changePassword' }
  );
