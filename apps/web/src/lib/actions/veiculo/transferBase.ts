/**
 * Server Action para Transferência de Base de Veículo
 *
 * Esta action implementa a transferência de veículo entre bases,
 * finalizando o vínculo atual e criando um novo vínculo histórico.
 *
 * FUNCIONALIDADES:
 * - Finaliza o vínculo atual (dataFim = agora)
 * - Cria novo vínculo histórico na nova base
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Auditoria automática
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await transferVeiculoBase({
 *   veiculoId: 1,
 *   novaBaseId: 2,
 *   motivo: 'Transferência por necessidade operacional'
 * });
 *
 * if (result.success) {
 *   console.log('Veículo transferido com sucesso');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

// Schema para validação dos dados de transferência
const transferVeiculoBaseSchema = z.object({
  veiculoId: z.number().int().positive(),
  novaBaseId: z.number().int().positive(),
  motivo: z.string().min(1).max(500).optional(),
});

/**
 * Transfere um veículo para uma nova base
 *
 * @param rawData - Dados da transferência (veiculoId, novaBaseId, motivo)
 * @returns Resultado da operação
 */
export const transferVeiculoBase = async (rawData: unknown) =>
  handleServerAction(
    transferVeiculoBaseSchema,
    async (data, session) => {
      const { veiculoId, novaBaseId, motivo } = data;

      // 1. Finaliza o vínculo atual (se existir)
      await prisma.veiculoBaseHistorico.updateMany({
        where: {
          veiculoId,
          dataFim: null, // Apenas vínculos ativos
        },
        data: {
          dataFim: new Date(),
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // 2. Cria novo vínculo histórico
      const novoVinculo = await prisma.veiculoBaseHistorico.create({
        data: {
          veiculoId,
          baseId: novaBaseId,
          dataInicio: new Date(),
          motivo: motivo || 'Transferência de base',
          createdBy: session.user.id,
          createdAt: new Date(),
        },
      });

      return novoVinculo;
    },
    rawData,
    { entityName: 'VeiculoBaseHistorico', actionType: 'transfer' }
  );
