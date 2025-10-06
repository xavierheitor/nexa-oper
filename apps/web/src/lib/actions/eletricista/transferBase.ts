/**
 * Server Action para Transferência de Base de Eletricista
 *
 * Esta action implementa a transferência de eletricista entre bases,
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
 * const result = await transferEletricistaBase({
 *   eletricistaId: 1,
 *   novaBaseId: 2,
 *   motivo: 'Transferência por necessidade operacional'
 * });
 *
 * if (result.success) {
 *   console.log('Eletricista transferido com sucesso');
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
const transferEletricistaBaseSchema = z.object({
  eletricistaId: z.number().int().positive(),
  novaBaseId: z.number().int().positive(),
  motivo: z.string().min(1).max(500).optional(),
});

/**
 * Transfere um eletricista para uma nova base
 *
 * @param rawData - Dados da transferência (eletricistaId, novaBaseId, motivo)
 * @returns Resultado da operação
 */
export const transferEletricistaBase = async (rawData: unknown) =>
  handleServerAction(
    transferEletricistaBaseSchema,
    async (data, session) => {
      const { eletricistaId, novaBaseId, motivo } = data;

      // 1. Finaliza o vínculo atual (se existir)
      await prisma.eletricistaBaseHistorico.updateMany({
        where: {
          eletricistaId,
          dataFim: null, // Apenas vínculos ativos
        },
        data: {
          dataFim: new Date(),
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      // 2. Cria novo vínculo histórico
      const novoVinculo = await prisma.eletricistaBaseHistorico.create({
        data: {
          eletricistaId,
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
    { entityName: 'EletricistaBaseHistorico', actionType: 'transfer' }
  );
