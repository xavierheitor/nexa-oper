/**
 * Server Action para Consulta de Usuário Móvel por ID
 *
 * Esta action implementa a consulta de um usuário móvel específico
 * através de Server Actions do Next.js, retornando dados completos
 * sem informações sensíveis como senha.
 *
 * FUNCIONALIDADES:
 * - Busca por ID com validação
 * - Exclusão automática de dados sensíveis
 * - Verificação de existência
 * - Suporte a relacionamentos (futuro)
 * - Auditoria da consulta
 * - Tratamento de erros padronizado
 *
 * COMPORTAMENTO:
 * - Retorna apenas usuários ativos (não excluídos)
 * - Senha é automaticamente excluída do retorno
 * - Dados de auditoria são incluídos
 * - Validação rigorosa do ID fornecido
 *
 * VALIDAÇÕES:
 * - ID deve ser um número inteiro positivo
 * - Usuário deve existir e estar ativo
 * - Usuário autenticado deve ter permissão
 *
 * SEGURANÇA:
 * - Apenas usuários autenticados podem consultar
 * - Dados sensíveis são automaticamente filtrados
 * - Operação é auditada para compliance
 * - Logs detalhados para debugging
 *
 * COMO USAR:
 * ```typescript
 * // Consulta por ID
 * const result = await getMobileUser({ id: 1 });
 * 
 * if (result.success && result.data) {
 *   console.log("Usuário encontrado:", result.data.username);
 * } else {
 *   console.log("Usuário não encontrado");
 * }
 * ```
 *
 * @param rawData - Dados contendo ID do usuário móvel
 * @returns Resultado com dados do usuário móvel (sem senha) ou null
 */

'use server';

import type { MobileUserService } from '@/lib/services/MobileUserService';
import { container } from '@/lib/services/common/registerServices';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação dos dados de consulta
const getMobileUserSchema = z.object({
  id: z.number().int().positive('ID do usuário móvel é obrigatório'),
});

/**
 * Busca um usuário móvel por ID
 *
 * Consulta o usuário móvel no banco de dados e retorna
 * seus dados (excluindo informações sensíveis).
 *
 * @param rawData - Dados contendo ID do usuário móvel
 * @returns Resultado com usuário encontrado ou null
 */
export const getMobileUser = async (rawData: unknown) =>
  handleServerAction(
    getMobileUserSchema,
    async (data, session) => {
      // Obtém o service do container
      const service = container.get<MobileUserService>('mobileUserService');

      // Busca o usuário móvel por ID
      const mobileUser = await service.getById(data.id);

      return mobileUser;
    },
    rawData,
    { entityName: 'MobileUser', actionType: 'get' }
  );
