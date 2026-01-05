/**
 * Server Action para Buscar Usuário Web por ID
 *
 * Esta action implementa a busca de um usuário específico
 * através de Server Actions do Next.js, retornando os dados
 * do usuário sem a senha.
 *
 * FUNCIONALIDADES:
 * - Busca por ID específico
 * - Autenticação obrigatória
 * - Exclusão automática da senha
 * - Verificação de usuários deletados (soft delete)
 * - Tratamento de erros específicos
 * - Logging de operações
 *
 * SEGURANÇA:
 * - Senha nunca é retornada
 * - Apenas usuários autenticados podem buscar
 * - Usuários deletados não são retornados
 *
 * COMO USAR:
 * ```typescript
 * const result = await getUser({ id: 1 });
 * 
 * if (result.success && result.data) {
 *   console.log('Usuário encontrado:', result.data);
 * } else if (result.success && !result.data) {
 *   console.log('Usuário não encontrado');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 *
 * @param rawData - Dados com ID do usuário a ser buscado
 * @returns Resultado da operação com o usuário encontrado (sem senha) ou null
 */

'use server';

import type { UserService } from '@/lib/services/auth/UserService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação do ID
const getUserSchema = z.object({
  id: z.number().int().positive('ID deve ser um número inteiro positivo'),
});

/**
 * Busca um usuário web por ID
 *
 * Retorna os dados do usuário (sem senha) se encontrado,
 * ou null se não existir ou estiver deletado.
 *
 * @param rawData - Dados com ID do usuário a ser buscado
 * @returns Resultado da operação com o usuário encontrado (sem senha) ou null
 */
export const getUser = async (rawData: unknown) =>
  handleServerAction(
    getUserSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Busca o usuário por ID (sem senha)
      const user = await service.getById(data.id);

      return user;
    },
    rawData,
    { entityName: 'User', actionType: 'get' }
  );
