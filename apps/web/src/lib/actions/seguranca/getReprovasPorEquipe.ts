/**
 * Server Action para buscar reprovas por equipe em um período
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import dayjs from 'dayjs';

const getReprovasPorEquipeSchema = z.object({
  dataInicio: z.union([z.date(), z.string()]),
  dataFim: z.union([z.date(), z.string()]),
  baseId: z.number().int().positive().optional(),
  tipoEquipeId: z.number().int().positive().optional(),
});

export const getReprovasPorEquipe = async (rawData: unknown) =>
  handleServerAction(
    getReprovasPorEquipeSchema,
    async (data) => {
      // Converter strings para Date se necessário
      const dataInicio = typeof data.dataInicio === 'string'
        ? new Date(data.dataInicio)
        : data.dataInicio;
      const dataFim = typeof data.dataFim === 'string'
        ? new Date(data.dataFim)
        : data.dataFim;

      // Ajustar dataFim para o final do dia
      const dataFimAjustada = dayjs(dataFim).endOf('day').toDate();

      // Construir filtro de base e tipo de equipe
      const whereEquipe: any = {};

      if (data.baseId) {
        whereEquipe.EquipeBaseHistorico = {
          some: {
            baseId: data.baseId,
            dataFim: null, // Base ativa (sem dataFim)
          },
        };
        whereEquipe.deletedAt = null;
      }

      if (data.tipoEquipeId) {
        whereEquipe.tipoEquipeId = data.tipoEquipeId;
        whereEquipe.deletedAt = null;
      }

      const whereTurnoEquipe = Object.keys(whereEquipe).length > 0
        ? {
            turno: {
              equipe: whereEquipe,
            },
          }
        : {};

      // Buscar todas as pendências no período
      // Filtramos pela data de preenchimento do checklist, não pela data de criação da pendência
      const pendencias = await prisma.checklistPendencia.findMany({
        where: {
          deletedAt: null,
          checklistPreenchido: {
            dataPreenchimento: {
              gte: dataInicio,
              lte: dataFimAjustada,
            },
          },
          ...whereTurnoEquipe,
        },
        include: {
          turno: {
            include: {
              equipe: true,
            },
          },
        },
      });

      // Agrupar por equipe e contar
      const reprovasPorEquipe = new Map<
        number,
        { equipeId: number; equipeNome: string; quantidade: number }
      >();

      for (const pendencia of pendencias) {
        const equipeId = pendencia.turno.equipe.id;
        const equipeNome = pendencia.turno.equipe.nome;

        if (reprovasPorEquipe.has(equipeId)) {
          const atual = reprovasPorEquipe.get(equipeId)!;
          atual.quantidade += 1;
        } else {
          reprovasPorEquipe.set(equipeId, {
            equipeId,
            equipeNome,
            quantidade: 1,
          });
        }
      }

      // Converter para array e ordenar por quantidade (decrescente)
      const resultado = Array.from(reprovasPorEquipe.values()).sort(
        (a, b) => b.quantidade - a.quantidade
      );

      return resultado;
    },
    rawData,
    { entityName: 'ReprovasPorEquipe', actionType: 'read' }
  );
