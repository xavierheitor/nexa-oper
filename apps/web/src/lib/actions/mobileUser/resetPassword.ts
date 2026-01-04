/**
 * Server Action para Reset de Senha de Usuários Móveis
 *
 * Esta action implementa o reset de senha de usuários móveis através
 * de Server Actions do Next.js, gerando uma nova senha aleatória
 * e enviando notificação para o dispositivo móvel.
 *
 * FUNCIONALIDADES:
 * - Geração de senha aleatória segura
 * - Hash da nova senha com bcrypt
 * - Notificação push para dispositivo (opcional)
 * - Auditoria automática da operação
 * - Validação de permissões
 * - Logging detalhado para compliance
 *
 * SEGURANÇA:
 * - Apenas usuários autorizados podem resetar senhas
 * - Nova senha é hasheada antes de salvar
 * - Operação é totalmente auditada
 * - Notificação é enviada de forma segura
 * - Senha anterior é invalidada imediatamente
 *
 * COMPORTAMENTO:
 * - Gera senha aleatória de 12 caracteres
 * - Inclui maiúsculas, minúsculas, números e símbolos
 * - Invalida sessões ativas (futuro)
 * - Registra timestamp da operação
 * - Notifica usuário via push (se habilitado)
 *
 * COMO USAR:
 * ```typescript
 * // Reset com notificação push
 * const result = await resetMobileUserPassword({
 *   userId: 1,
 *   sendNotification: true,
 *   notifyUser: true
 * });
 * 
 * // Reset sem notificação (para uso interno)
 * const result = await resetMobileUserPassword({
 *   userId: 1,
 *   sendNotification: false,
 *   notifyUser: false
 * });
 * ```
 *
 * @param rawData - Dados do reset incluindo userId e opções de notificação
 * @returns Resultado da operação com informações do reset
 */

'use server';

import type { MobileUserService } from '@/lib/services/auth/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação dos dados de reset
const resetMobileUserPasswordSchema = z.object({
  userId: z.number().int().positive('ID do usuário móvel deve ser um número inteiro positivo'),
  sendNotification: z.boolean().default(true),
  notifyUser: z.boolean().default(true), // Se deve notificar o usuário sobre o reset
});

/**
 * Reseta a senha de um usuário móvel
 *
 * Gera uma nova senha aleatória, hasheia com bcrypt e
 * opcionalmente envia notificação push para o dispositivo.
 *
 * @param rawData - Dados do reset incluindo userId e configurações
 * @returns Resultado da operação com detalhes do reset
 */
export const resetMobileUserPassword = async (rawData: unknown) =>
  handleServerAction(
    resetMobileUserPasswordSchema,
    async (data, session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Executa o reset de senha
      const result = await service.resetPassword(
        {
          userId: data.userId,
          sendEmail: data.sendNotification, // Reutiliza lógica mas para notificação push
          notifyUser: data.notifyUser,
        },
        session.user.id
      );

      return result;
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'resetPassword' } // ✅ ActionType flexível!
  );
