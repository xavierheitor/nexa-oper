/**
 * Server Action para Visualização Geral de Escalas
 *
 * Retorna escalas com informações da equipe e base atual
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const visualizacaoGeralSchema = z.object({
  periodoInicio: z.coerce.date(),
  periodoFim: z.coerce.date(),
});

export const getVisualizacaoGeral = async (rawData: unknown) =>
  handleServerAction(
    visualizacaoGeralSchema,
    async (data) => {
      // Busca todas as escalas que intersectam com o período
      const escalas = await prisma.escalaEquipePeriodo.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              AND: [
                { periodoInicio: { lte: data.periodoFim } },
                { periodoFim: { gte: data.periodoInicio } },
              ],
            },
          ],
        },
        include: {
          equipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          tipoEscala: {
            select: {
              nome: true,
              modoRepeticao: true,
            },
          },
          Slots: {
            where: {
              deletedAt: null,
              data: {
                gte: data.periodoInicio,
                lte: data.periodoFim,
              },
            },
            include: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
            },
            orderBy: {
              data: 'asc',
            },
          },
          _count: {
            select: {
              Slots: true,
            },
          },
        },
        orderBy: {
          periodoInicio: 'asc',
        },
      });

      // Para cada escala, busca a base atual da equipe
      const escalasComBase = await Promise.all(
        escalas.map(async (escala) => {
          const baseHistorico = await prisma.equipeBaseHistorico.findFirst({
            where: {
              equipeId: escala.equipe.id,
              dataFim: null,
              deletedAt: null,
            },
            include: {
              base: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
            orderBy: {
              dataInicio: 'desc',
            },
          });

          // Verifica se tem horário definido (EquipeTurnoHistorico - tabela atual)
          const temHorario = await prisma.equipeTurnoHistorico.findFirst({
            where: {
              equipeId: escala.equipe.id,
              dataFim: null, // Apenas horário vigente (ativo)
              deletedAt: null,
            },
          });

          return {
            ...escala,
            equipeBaseAtual: baseHistorico?.base || null,
            temHorario: !!temHorario,
          };
        })
      );

      return escalasComBase;
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );

