/**
 * Server Action para Criação de Usuários Móveis
 *
 * Esta action implementa a criação de novos usuários móveis através
 * de Server Actions do Next.js, com validação completa, hash de senha
 * e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação rigorosa com Zod schema
 * - Hash seguro da senha com bcrypt
 * - Verificação de unicidade de username
 * - Auditoria automática da operação
 * - Logging detalhado para debugging
 * - Tratamento de erros padronizado
 *
 * VALIDAÇÕES:
 * - Username único e formato válido
 * - Senha forte com critérios específicos
 * - Confirmação de senha obrigatória
 * - Dados de entrada sanitizados
 *
 * SEGURANÇA:
 * - Apenas usuários autenticados podem criar
 * - Senha é hasheada antes do armazenamento
 * - Dados sensíveis não retornam ao cliente
 * - Operação totalmente auditada
 *
 * COMO USAR:
 * ```typescript
 * const result = await createMobileUser({
 *   username: "user123",
 *   password: "MyStr0ng@Pass",
 *   confirmPassword: "MyStr0ng@Pass"
 * });
 * 
 * if (result.success) {
 *   console.log("Usuário móvel criado:", result.data);
 * }
 * ```
 *
 * @param rawData - Dados do usuário móvel incluindo username e senha
 * @returns Resultado da operação com dados do usuário criado (sem senha)
 */

'use server';

import type { MobileUserService } from '@/lib/services/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { mobileUserCreateSchema } from '../../schemas/mobileUserSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo usuário móvel
 *
 * Valida os dados de entrada, verifica unicidade do username,
 * hasheia a senha e persiste o usuário no banco de dados.
 *
 * @param rawData - Dados brutos do usuário móvel incluindo senha
 * @returns Resultado da operação com usuário criado (sem senha)
 */
export const createMobileUser = async (rawData: unknown) =>
  handleServerAction(
    mobileUserCreateSchema,
    async (data, session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Cria o usuário móvel
      const newMobileUser = await service.create(data, session.user.id);

      return newMobileUser;
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'create' }
  );
