/**
 * Server Action para Transferência de Base de Equipe
 *
 * Esta action implementa a transferência de equipe entre bases,
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
 * const result = await transferEquipeBase({
 *   equipeId: 1,
 *   novaBaseId: 2,
 *   motivo: 'Transferência por realocação de operações'
 * });
 *
 * if (result.success) {
 *   console.log('Equipe transferida com sucesso');
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
const transferEquipeBaseSchema = z.object({
  equipeId: z.number().int().positive(),
  novaBaseId: z.number().int().positive(),
  motivo: z.string().min(1).max(500).optional(),
});

/**
 * Transfere uma equipe para uma nova base
 *
 * @param rawData - Dados da transferência (equipeId, novaBaseId, motivo)
 * @returns Resultado da operação
 */
export const transferEquipeBase = async (rawData: unknown) =>
  handleServerAction(
    transferEquipeBaseSchema,
    async (data, session) => {
      const { equipeId, novaBaseId, motivo } = data;

      // 1. Finaliza o vínculo atual (se existir)
      await prisma.equipeBaseHistorico.updateMany({
        where: {
          equipeId,
          dataFim: null, // Apenas vínculos ativos
        },
        data: {
          dataFim: new Date(),
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // 2. Cria novo vínculo histórico
      const novoVinculo = await prisma.equipeBaseHistorico.create({
        data: {
          equipeId,
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
    { entityName: 'EquipeBaseHistorico', actionType: 'transfer' }
  );

