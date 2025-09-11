/**
 * Server Action para Listagem de Usuários Web
 *
 * Esta action implementa a listagem paginada de usuários web
 * com suporte a filtros, ordenação, busca e includes dinâmicos.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada
 * - Busca por nome, email ou username
 * - Filtros por status (ativo/inativo)
 * - Ordenação configurável
 * - Includes dinâmicos para relacionamentos
 * - Exclusão automática de senhas
 * - Soft delete (usuários deletados não aparecem)
 *
 * SEGURANÇA:
 * - Senhas nunca são retornadas
 * - Apenas usuários autenticados podem listar
 * - Soft delete para auditoria
 *
 * COMO USAR:
 * ```typescript
 * const result = await listUsers({
 *   page: 1,
 *   pageSize: 10,
 *   search: 'joão',
 *   orderBy: 'nome',
 *   orderDir: 'asc',
 *   ativo: true
 * });
 * 
 * if (result.success) {
 *   console.log('Usuários:', result.data.data);
 *   console.log('Total:', result.data.total);
 * }
 * ```
 *
 * @param rawData - Parâmetros de paginação e filtros
 * @returns Resultado paginado com usuários (sem senhas)
 */

'use server';

import type { UserService } from '@/lib/services/UserService';
import { container } from '@/lib/services/common/registerServices';
import { userFilterSchema } from '../../schemas/userSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista usuários web com paginação e filtros
 *
 * Retorna uma lista paginada de usuários, excluindo senhas
 * e permitindo busca por nome, email ou username.
 *
 * @param rawData - Parâmetros de paginação e filtros
 * @returns Resultado paginado com usuários (sem senhas)
 */
export const listUsers = async (rawData: unknown) =>
  handleServerAction(
    userFilterSchema,
    async (data) => {
      // Obtém o serviço do container
      const service = container.get<UserService>('userService');

      // Lista usuários com paginação e filtros
      const result = await service.list(data);

      return result;
    },
    rawData,
    { entityName: 'User', actionType: 'list' }
  );
