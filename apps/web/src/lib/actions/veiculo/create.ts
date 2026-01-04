/**
 * Server Action para Criação de Veículos
 *
 * Esta action implementa a criação de veículos através
 * de Server Actions do Next.js, incluindo validação,
 * autenticação e auditoria automática.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod (placa, modelo, ano, relacionamentos)
 * - Autenticação obrigatória
 * - Auditoria automática (createdBy, createdAt)
 * - Tratamento de erros
 * - Logging de operações
 * - Conversão automática de relacionamentos para Prisma
 *
 * COMO USAR:
 * ```typescript
 * const result = await createVeiculo({
 *   placa: 'ABC1234',
 *   modelo: 'Civic',
 *   ano: 2023,
 *   tipoVeiculoId: 1,
 *   contratoId: 1
 * });
 *
 * if (result.success) {
 *   console.log('Veículo criado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { VeiculoService } from '@/lib/services/infraestrutura/VeiculoService';
import { container } from '@/lib/services/common/registerServices';
import { veiculoCreateSchema } from '../../schemas/veiculoSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Cria um novo veículo
 *
 * @param rawData - Dados brutos do veículo (placa, modelo, ano, tipoVeiculoId, contratoId)
 * @returns Resultado da operação com o veículo criado
 */
export const createVeiculo = async (rawData: unknown) =>
  handleServerAction(
    veiculoCreateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<VeiculoService>('veiculoService');

      // Cria o veículo com conversão automática de relacionamentos
      return service.create(data, session.user.id);
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'create' }
  );
