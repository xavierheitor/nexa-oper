/**
 * Server Action para Criação de Tipos de Veículo
 *
 * Esta action implementa a criação de tipos de veículo através
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
 * const result = await createTipoVeiculo({
 *   nome: 'Carro'
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

import type { TipoVeiculoService } from '@/lib/services/TipoVeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { tipoVeiculoCreateSchema } from '../../schemas/tipoVeiculoSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo tipo de veículo
 *
 * @param rawData - Dados brutos do tipo de veículo (nome)
 * @returns Resultado da operação com o tipo de veículo criado
 */
export const createTipoVeiculo = async (rawData: unknown) =>
  handleServerAction(
    tipoVeiculoCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<TipoVeiculoService>('tipoVeiculoService');

      // Cria o tipo de veículo com auditoria automática
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'TipoVeiculo', actionType: 'create' }
  );
