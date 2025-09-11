/**
 * Server Action para Criação de Usuários Web
 *
 * Esta action implementa a criação de usuários web através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação, hash de senhas e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Hash seguro de senhas com bcrypt
 * - Validação de unicidade (email/username)
 * - Confirmação de senha obrigatória
 * - Auditoria automática (createdBy, createdAt)
 * - Tratamento de erros específicos
 * - Logging de operações
 *
 * SEGURANÇA:
 * - Senhas são hasheadas antes de salvar
 * - Validação de senha forte
 * - Verificação de unicidade
 * - Auditoria completa
 *
 * COMO USAR:
 * ```typescript
 * const result = await createUser({
 *   nome: 'João Silva',
 *   email: 'joao@example.com',
 *   username: 'joao.silva',
 *   password: 'MinhaSenh@123',
 *   confirmPassword: 'MinhaSenh@123'
 * });
 * 
 * if (result.success) {
 *   console.log('Usuário criado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 *
 * @param rawData - Dados brutos do usuário
 * @returns Resultado da operação com o usuário criado (sem senha)
 */

'use server';

import type { UserService } from '@/lib/services/UserService';
import { container } from '@/lib/services/common/registerServices';
import { userCreateSchema } from '../../schemas/userSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo usuário web
 *
 * Valida os dados de entrada, verifica unicidade de email/username,
 * hasheia a senha e cria o usuário no banco de dados.
 *
 * @param rawData - Dados brutos do usuário incluindo confirmação de senha
 * @returns Resultado da operação com o usuário criado (sem senha)
 */
export const createUser = async (rawData: unknown) =>
  handleServerAction(
    userCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Cria o usuário com hash de senha e auditoria automática
      const user = await service.create(data, session.user.id);

      return user;
    },
    rawData,
    { entityName: 'User', actionType: 'create' }
  );
