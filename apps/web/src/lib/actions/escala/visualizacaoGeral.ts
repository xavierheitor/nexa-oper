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

          // Verifica se tem horário vigente que intersecta com o período da escala
          // Um horário é considerado ativo se sua vigência sobrepõe o período da escala
          const temHorario = await prisma.equipeTurnoHistorico.findFirst({
            where: {
              equipeId: escala.equipe.id,
              deletedAt: null,
              dataInicio: { lte: escala.periodoFim }, // Começou antes ou durante o período
              OR: [
                { dataFim: null }, // Sem fim (vigente indefinidamente)
                { dataFim: { gte: escala.periodoInicio } }, // Termina depois ou durante o período
              ],
            },
            select: {
              id: true,
              inicioTurnoHora: true,
              duracaoHoras: true,
              duracaoIntervaloHoras: true,
              fimTurnoHora: true,
              dataInicio: true,
              dataFim: true,
            },
          });

          console.log(
            `[VisualizacaoGeral] Equipe ${escala.equipe.nome} (ID: ${escala.equipe.id}):`,
            {
              periodoEscala: `${escala.periodoInicio} - ${escala.periodoFim}`,
              temHorario: !!temHorario,
              horarioEncontrado: temHorario
                ? {
                    id: temHorario.id,
                    inicioTurnoHora: temHorario.inicioTurnoHora,
                    duracaoHoras: temHorario.duracaoHoras,
                    vigencia: `${temHorario.dataInicio} até ${temHorario.dataFim || 'indefinido'}`,
                  }
                : null,
            }
          );

          return {
            ...escala,
            equipeBaseAtual: baseHistorico?.base || null,
            temHorario: !!temHorario,
            horarioInfo: temHorario
              ? {
                  id: temHorario.id,
                  inicioTurnoHora: temHorario.inicioTurnoHora,
                  duracaoHoras: Number(temHorario.duracaoHoras), // Converte Decimal para number
                  duracaoIntervaloHoras: Number(
                    temHorario.duracaoIntervaloHoras
                  ), // Converte Decimal para number
                  fimTurnoHora: temHorario.fimTurnoHora,
                  dataInicio: temHorario.dataInicio,
                  dataFim: temHorario.dataFim,
                }
              : null,
          };
        })
      );

      return escalasComBase;
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );

