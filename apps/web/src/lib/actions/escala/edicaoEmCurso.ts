/**
 * Server Action para Edição em Curso
 *
 * Retorna escalas publicadas com informações completas para visualização em grade
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const edicaoEmCursoSchema = z.object({
  periodoInicio: z.coerce.date(),
  periodoFim: z.coerce.date(),
});

export const getEscalasPublicadas = async (rawData: unknown) =>
  handleServerAction(
    edicaoEmCursoSchema,
    async (data) => {
      // Busca apenas escalas PUBLICADAS que intersectam com o período
      const escalas = await prisma.escalaEquipePeriodo.findMany({
        where: {
          deletedAt: null,
          status: 'PUBLICADA',
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
              tipoEquipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
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
            select: {
              id: true,
              data: true,
              estado: true,
              eletricistaId: true,
              inicioPrevisto: true,
              fimPrevisto: true,
              anotacoesDia: true,
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
        },
        orderBy: [
          { periodoInicio: 'asc' },
          { equipeId: 'asc' },
        ],
      });

      // Buscar bases e horários das equipes
      const equipeIds = escalas.map(e => e.equipeId);

      // Busca todas as bases das equipes
      const todasBases = await prisma.equipeBaseHistorico.findMany({
        where: {
          equipeId: {
            in: equipeIds,
          },
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

      // Busca todos os horários das equipes que intersectam com o período
      const todosHorarios = await prisma.equipeTurnoHistorico.findMany({
        where: {
          equipeId: {
            in: equipeIds,
          },
          deletedAt: null,
          dataInicio: { lte: data.periodoFim },
          OR: [
            { dataFim: null },
            { dataFim: { gte: data.periodoInicio } },
          ],
        },
        select: {
          id: true,
          equipeId: true,
          inicioTurnoHora: true,
          duracaoHoras: true,
          duracaoIntervaloHoras: true,
          fimTurnoHora: true,
          dataInicio: true,
          dataFim: true,
        },
      });

      // Agrupa bases por equipeId
      const basePorEquipe = new Map<number, typeof todasBases[0]>();
      todasBases.forEach(base => {
        if (!basePorEquipe.has(base.equipeId)) {
          basePorEquipe.set(base.equipeId, base);
        }
      });

      // Agrupa horários por equipeId
      const horarioPorEquipe = new Map<number, typeof todosHorarios[0]>();
      todosHorarios.forEach(horario => {
        if (!horarioPorEquipe.has(horario.equipeId)) {
          horarioPorEquipe.set(horario.equipeId, horario);
        }
      });

      // Mapeia escalas com base e horário
      const escalasCompleta = escalas.map(escala => {
        const baseHistorico = basePorEquipe.get(escala.equipeId);
        const horario = horarioPorEquipe.get(escala.equipeId);

        return {
          ...escala,
          base: baseHistorico?.base || null,
          horario: horario
            ? {
                inicioTurnoHora: horario.inicioTurnoHora,
                fimTurnoHora: horario.fimTurnoHora,
              }
            : null,
        };
      });

      return escalasCompleta;
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );
