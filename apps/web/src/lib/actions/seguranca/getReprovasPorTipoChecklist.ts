/**
 * Server Action para buscar reprovas por tipo de checklist em um período
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import dayjs from 'dayjs';

const getReprovasPorTipoChecklistSchema = z.object({
  dataInicio: z.union([z.date(), z.string()]),
  dataFim: z.union([z.date(), z.string()]),
  baseId: z.number().int().positive().optional(),
  tipoEquipeId: z.number().int().positive().optional(),
});

export const getReprovasPorTipoChecklist = async (rawData: unknown) =>
  handleServerAction(
    getReprovasPorTipoChecklistSchema,
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
          checklistPreenchido: {
            include: {
              checklist: {
                include: {
                  tipoChecklist: true,
                },
              },
            },
          },
        },
      });

      // Agrupar por tipo de checklist e contar
      const reprovasPorTipoChecklist = new Map<
        number,
        { tipoChecklistId: number; tipoChecklistNome: string; quantidade: number }
      >();

      for (const pendencia of pendencias) {
        const tipoChecklistId = pendencia.checklistPreenchido.checklist.tipoChecklist.id;
        const tipoChecklistNome = pendencia.checklistPreenchido.checklist.tipoChecklist.nome;

        if (reprovasPorTipoChecklist.has(tipoChecklistId)) {
          const atual = reprovasPorTipoChecklist.get(tipoChecklistId)!;
          atual.quantidade += 1;
        } else {
          reprovasPorTipoChecklist.set(tipoChecklistId, {
            tipoChecklistId,
            tipoChecklistNome,
            quantidade: 1,
          });
        }
      }

      // Converter para array e ordenar por quantidade (decrescente)
      const resultado = Array.from(reprovasPorTipoChecklist.values()).sort(
        (a, b) => b.quantidade - a.quantidade
      );

      return resultado;
    },
    rawData,
    { entityName: 'ReprovasPorTipoChecklist', actionType: 'read' }
  );
