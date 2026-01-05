/**
 * Server Action para criar veículos em lote
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { veiculoLoteSchema } from '@/lib/schemas/veiculoSchema';
import { container } from '@/lib/services/common/registerServices';
import type { VeiculoService } from '@/lib/services/infraestrutura/VeiculoService';
import { prisma } from '@/lib/db/db.service';

export const createVeiculosLote = async (rawData: unknown) =>
  handleServerAction(
    veiculoLoteSchema,
    async (data, session) => {
      const service = container.get<VeiculoService>('veiculoService');

      // Criar todos os veículos em uma transação
      const veiculosCriados = await prisma.$transaction(async (tx) => {
        const resultados = [];

        for (const veiculoData of data.veiculos) {
          const veiculo = await tx.veiculo.create({
            data: {
              placa: veiculoData.placa,
              modelo: veiculoData.modelo,
              ano: veiculoData.ano,
              tipoVeiculo: { connect: { id: data.tipoVeiculoId } },
              contrato: { connect: { id: data.contratoId } },
              createdAt: new Date(),
              createdBy: session.user.id,
            },
          });

          // Criar histórico de base
          await tx.veiculoBaseHistorico.create({
            data: {
              veiculoId: veiculo.id,
              baseId: data.baseId,
              dataInicio: new Date(),
              dataFim: null, // Base atual
              createdAt: new Date(),
              createdBy: session.user.id,
            },
          });

          resultados.push(veiculo);
        }

        return resultados;
      });

      return {
        veiculosCriados: veiculosCriados.length,
        veiculos: veiculosCriados,
      };
    },
    rawData,
    { entityName: 'Veiculo', actionType: 'create' }
  );

