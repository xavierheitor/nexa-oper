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

      // ✅ OTIMIZAÇÃO: Buscar todas as bases e horários de uma vez (evita N+1 queries)
      const equipeIds = escalas.map(e => e.equipe.id);

      // Busca todas as bases das equipes de uma vez
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
      // Um horário é considerado ativo se sua vigência sobrepõe o período da escala
      const todosHorarios = await prisma.equipeTurnoHistorico.findMany({
        where: {
          equipeId: {
            in: equipeIds,
          },
          deletedAt: null,
          dataInicio: { lte: data.periodoFim }, // Começou antes ou durante o período
          OR: [
            { dataFim: null }, // Sem fim (vigente indefinidamente)
            { dataFim: { gte: data.periodoInicio } }, // Termina depois ou durante o período
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

      // Agrupa bases por equipeId (pega a mais recente, já está ordenado por dataInicio desc)
      const basePorEquipe = new Map<number, typeof todasBases[0]>();
      todasBases.forEach(base => {
        if (!basePorEquipe.has(base.equipeId)) {
          basePorEquipe.set(base.equipeId, base);
        }
      });

      // Agrupa horários por equipeId (pega o primeiro que intersecta)
      const horarioPorEquipe = new Map<number, typeof todosHorarios[0]>();
      todosHorarios.forEach(horario => {
        if (!horarioPorEquipe.has(horario.equipeId)) {
          horarioPorEquipe.set(horario.equipeId, horario);
        }
      });

      // Mapeia escalas usando os dados já carregados
      const escalasComBase = escalas.map(escala => {
        const baseHistorico = basePorEquipe.get(escala.equipe.id);
        const temHorario = horarioPorEquipe.get(escala.equipe.id);

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
      });

      return escalasComBase;
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'get' }
  );

