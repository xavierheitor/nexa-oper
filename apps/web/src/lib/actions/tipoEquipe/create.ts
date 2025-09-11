/**
 * Server Action para Criação de Tipos de Equipe
 *
 * Esta action implementa a criação de tipos de equipe através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (nome obrigatório)
 * - Autenticação obrigatória
 * - Auditoria automática (createdBy, createdAt)
 * - Tratamento de erros
 * - Logging de operações
 *
 * COMO USAR:
 * ```typescript
 * const result = await createTipoEquipe({
 *   nome: 'Linha Viva'
 * });
 *
 * if (result.success) {
 *   console.log('Tipo criado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { TipoEquipeService } from '@/lib/services/TipoEquipeService';
import { container } from '@/lib/services/common/registerServices';
import { tipoEquipeCreateSchema } from '../../schemas/tipoEquipeSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo tipo de equipe
 *
 * @param rawData - Dados brutos do tipo de equipe (nome)
 * @returns Resultado da operação com o tipo de equipe criado
 */
export const createTipoEquipe = async (rawData: unknown) =>
  handleServerAction(
    tipoEquipeCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<TipoEquipeService>('tipoEquipeService');

      // Cria o tipo de equipe com auditoria automática
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoEquipe', actionType: 'create' }
  );

