/**
 * Server Action para Atualização de Usuários Móveis
 *
 * Esta action implementa a atualização de usuários móveis existentes
 * através de Server Actions do Next.js, com validação completa,
 * verificação de unicidade e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Atualização parcial ou completa de dados
 * - Validação rigorosa com Zod schema
 * - Verificação de unicidade de username
 * - Hash seguro de nova senha (se fornecida)
 * - Auditoria automática da operação
 * - Tratamento de erros padronizado
 *
 * CAMPOS ATUALIZÁVEIS:
 * - username: Deve ser único no sistema
 * - password: Será hasheada automaticamente
 * - Campos de auditoria são atualizados automaticamente
 *
 * VALIDAÇÕES:
 * - Usuário móvel deve existir
 * - Username deve ser único (se alterado)
 * - Senha deve atender critérios (se fornecida)
 * - Confirmação de senha obrigatória (se senha fornecida)
 *
 * SEGURANÇA:
 * - Apenas usuários autenticados podem atualizar
 * - Senha é hasheada antes do armazenamento
 * - Dados sensíveis não retornam ao cliente
 * - Operação totalmente auditada
 *
 * COMO USAR:
 * ```typescript
 * // Atualizar apenas username
 * const result = await updateMobileUser({
 *   id: 1,
 *   username: "newusername"
 * });
 * 
 * // Atualizar senha
 * const result = await updateMobileUser({
 *   id: 1,
 *   password: "NewStr0ng@Pass",
 *   confirmPassword: "NewStr0ng@Pass"
 * });
 * 
 * // Atualização completa
 * const result = await updateMobileUser({
 *   id: 1,
 *   username: "updateduser",
 *   password: "NewStr0ng@Pass",
 *   confirmPassword: "NewStr0ng@Pass"
 * });
 * ```
 *
 * @param rawData - Dados de atualização incluindo ID obrigatório
 * @returns Resultado da operação com dados atualizados (sem senha)
 */

'use server';

import type { MobileUserService } from '@/lib/services/auth/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { mobileUserUpdateSchema } from '../../schemas/mobileUserSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um usuário móvel existente
 *
 * Valida os dados de entrada, verifica existência e unicidade,
 * aplica as alterações e retorna o usuário atualizado.
 *
 * @param rawData - Dados de atualização incluindo ID
 * @returns Resultado da operação com usuário atualizado (sem senha)
 */
export const updateMobileUser = async (rawData: unknown) =>
  handleServerAction(
    mobileUserUpdateSchema,
    async (data, session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Atualiza o usuário móvel
      const updatedMobileUser = await service.update(data, session.user.id);

      return updatedMobileUser;
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'update' }
  );
