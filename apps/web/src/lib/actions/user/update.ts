/**
 * Server Action para Atualização de Usuários Web
 *
 * Esta action implementa a atualização de usuários web através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação, hash de senhas (quando alteradas) e auditoria.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Atualização parcial de campos
 * - Hash de senha apenas quando alterada
 * - Validação de unicidade (email/username)
 * - Confirmação de senha quando alterada
 * - Auditoria automática (updatedBy, updatedAt)
 * - Tratamento de erros específicos
 *
 * SEGURANÇA:
 * - Senhas são hasheadas antes de salvar
 * - Validação de unicidade excluindo o próprio usuário
 * - Verificação de existência do usuário
 * - Auditoria completa
 *
 * COMO USAR:
 * ```typescript
 * // Atualizar apenas nome
 * const result = await updateUser({
 *   id: 1,
 *   nome: 'João Silva Santos'
 * });
 * 
 * // Atualizar com nova senha
 * const result = await updateUser({
 *   id: 1,
 *   nome: 'João Silva Santos',
 *   password: 'NovaSen@123',
 *   confirmPassword: 'NovaSen@123'
 * });
 * ```
 *
 * @param rawData - Dados de atualização do usuário
 * @returns Resultado da operação com o usuário atualizado (sem senha)
 */

'use server';

import type { UserService } from '@/lib/services/auth/UserService';
import { container } from '@/lib/services/common/registerServices';
import { userUpdateSchema } from '../../schemas/userSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um usuário web existente
 *
 * Permite atualização parcial dos campos, incluindo alteração
 * de senha com confirmação. Valida unicidade de email/username.
 *
 * @param rawData - Dados de atualização incluindo ID do usuário
 * @returns Resultado da operação com o usuário atualizado (sem senha)
 */
export const updateUser = async (rawData: unknown) =>
  handleServerAction(
    userUpdateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Atualiza o usuário com validação e auditoria automática
      const user = await service.update(data, session.user.id);

      return user;
    },
    rawData,
    { entityName: 'User', actionType: 'update' }
  );
