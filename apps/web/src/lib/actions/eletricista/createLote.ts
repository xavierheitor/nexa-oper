/**
 * Server Action para criar eletricistas em lote
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { eletricistaLoteSchema } from '@/lib/schemas/eletricistaSchema';
import { prisma } from '@/lib/db/db.service';

export const createEletricistasLote = async (rawData: unknown) =>
  handleServerAction(
    eletricistaLoteSchema,
    async (data, session) => {
      // Criar todos os eletricistas em uma transação otimizada
      const eletricistasCriados = await prisma.$transaction(
        async (tx) => {
          const now = new Date();
          const userId = session.user.id;

          // Criar todos os eletricistas de uma vez usando createMany
          const eletricistasData = data.eletricistas.map((e) => ({
            nome: e.nome,
            matricula: e.matricula,
            telefone: e.telefone,
            estado: e.estado,
            admissao: e.admissao,
            cargoId: data.cargoId,
            contratoId: data.contratoId,
            createdAt: now,
            createdBy: userId,
          }));

          await tx.eletricista.createMany({
            data: eletricistasData,
          });

          // Buscar os IDs dos eletricistas recém-criados
          const eletricistasCreated = await tx.eletricista.findMany({
            where: {
              matricula: {
                in: data.eletricistas.map((e) => e.matricula),
              },
              contratoId: data.contratoId,
              createdAt: now,
            },
            select: {
              id: true,
              matricula: true,
            },
          });

          // Criar um mapa de matrícula -> id
          const matriculaToId = new Map(
            eletricistasCreated.map((e) => [e.matricula, e.id])
          );

          // Criar históricos de base em lote
          const historicosData = data.eletricistas.map((e) => {
            const eletricistaId = matriculaToId.get(e.matricula);
            if (!eletricistaId) {
              throw new Error(`Eletricista com matrícula ${e.matricula} não encontrado`);
            }
            return {
              eletricistaId,
              baseId: data.baseId,
              dataInicio: e.admissao,
              dataFim: null,
              motivo: 'Lotação inicial',
              createdAt: now,
              createdBy: userId,
            };
          });

          await tx.eletricistaBaseHistorico.createMany({
            data: historicosData,
          });

          return eletricistasCreated;
        },
        {
          maxWait: 10000, // Tempo máximo de espera: 10 segundos
          timeout: 30000, // Timeout da transação: 30 segundos
        }
      );

      return {
        eletricistasCriados: eletricistasCriados.length,
        eletricistas: eletricistasCriados,
      };
    },
    rawData,
    { entityName: 'Eletricista', actionType: 'create' }
  );

