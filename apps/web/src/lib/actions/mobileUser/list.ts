/**
 * Server Action para Listagem de Usuários Móveis
 *
 * Esta action implementa a listagem paginada de usuários móveis
 * com suporte a filtros, busca textual, ordenação e includes
 * dinâmicos para relacionamentos.
 *
 * FUNCIONALIDADES:
 * - Listagem paginada com controle de limite
 * - Busca textual por username
 * - Ordenação por qualquer campo
 * - Filtros dinâmicos via parâmetros
 * - Includes dinâmicos para relacionamentos
 * - Contagem total para paginação
 * - Exclusão automática de senhas
 *
 * PARÂMETROS SUPORTADOS:
 * - search: Busca textual em campos relevantes
 * - page: Página atual (base 1)
 * - limit: Registros por página (máximo 100)
 * - sortBy: Campo para ordenação
 * - sortOrder: Direção da ordenação (asc/desc)
 * - include: Relacionamentos a incluir
 *
 * SEGURANÇA:
 * - Senhas são automaticamente excluídas
 * - Apenas usuários autenticados podem listar
 * - Filtros são validados e sanitizados
 * - Operação totalmente auditada
 *
 * COMO USAR:
 * ```typescript
 * // Listagem simples
 * const result = await listMobileUsers();
 * 
 * // Com filtros e paginação
 * const result = await listMobileUsers({
 *   search: "admin",
 *   page: 1,
 *   limit: 10,
 *   sortBy: "username",
 *   sortOrder: "asc"
 * });
 * 
 * // Com relacionamentos
 * const result = await listMobileUsers({
 *   include: { mobileSession: true }
 * });
 * ```
 *
 * @param rawData - Parâmetros de filtro, paginação e ordenação
 * @returns Resultado paginado com usuários móveis (sem senhas)
 */

'use server';

import type { MobileUserService } from '@/lib/services/auth/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { mobileUserFilterSchema } from '../../schemas/mobileUserSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Lista usuários móveis com paginação e filtros
 *
 * Aplica filtros de busca, paginação e ordenação conforme
 * parâmetros fornecidos, retornando resultado estruturado.
 *
 * @param rawData - Parâmetros de filtro e paginação
 * @returns Resultado paginado com usuários móveis encontrados
 */
export const listMobileUsers = async (rawData: unknown = {}) =>
  handleServerAction(
    mobileUserFilterSchema,
    async (data, _session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Lista os usuários móveis com os filtros aplicados
      const result = await service.list(data as any);

      return result;
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'list' }
  );
