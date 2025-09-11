/**
 * Server Action para Reset de Senha de Usuários Web
 *
 * Esta action implementa o reset de senha de usuários web através
 * de Server Actions do Next.js, gerando uma nova senha aleatória
 * e enviando por email.
 *
 * FUNCIONALIDADES:
 * - Geração de senha aleatória segura
 * - Hash da nova senha com bcrypt
 * - Envio por email (opcional)
 * - Auditoria automática
 * - Validação de permissões
 * - Logging detalhado
 *
 * SEGURANÇA:
 * - Apenas usuários autorizados podem resetar senhas
 * - Nova senha é hasheada antes de salvar
 * - Operação é totalmente auditada
 * - Email é enviado de forma segura
 *
 * COMO USAR:
 * ```typescript
 * // Reset com envio de email
 * const result = await resetUserPassword({
 *   userId: 1,
 *   sendEmail: true
 * });
 * 
 * // Reset sem envio de email (para uso interno)
 * const result = await resetUserPassword({
 *   userId: 1,
 *   sendEmail: false
 * });
 * ```
 *
 * @param rawData - Dados do reset incluindo userId e opções
 * @returns Resultado da operação com informações do reset
 */

'use server';

import type { UserService } from '@/lib/services/UserService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação dos dados de reset
const resetPasswordSchema = z.object({
  userId: z.number().int().positive('ID do usuário deve ser um número inteiro positivo'),
  sendEmail: z.boolean().default(true),
  notifyUser: z.boolean().default(true), // Se deve notificar o usuário sobre o reset
});

/**
 * Reseta a senha de um usuário web
 *
 * Gera uma nova senha aleatória, hasheia com bcrypt e
 * opcionalmente envia por email para o usuário.
 *
 * @param rawData - Dados do reset incluindo userId e configurações
 * @returns Resultado da operação com detalhes do reset
 */
export const resetUserPassword = async (rawData: unknown) =>
  handleServerAction(
    resetPasswordSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Executa o reset de senha
      const result = await service.resetPassword(data, session.user.id);

      return result;
    },
    rawData,
    { entityName: 'User', actionType: 'resetPassword' } // ✅ Novo tipo funciona automaticamente!
  );
