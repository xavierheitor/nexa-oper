/**
 * Server Action para buscar reprovas por pergunta em um período
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import dayjs from 'dayjs';

const getReprovasPorPerguntaSchema = z.object({
  dataInicio: z.union([z.date(), z.string()]),
  dataFim: z.union([z.date(), z.string()]),
  baseId: z.number().int().positive().optional(),
});

export const getReprovasPorPergunta = async (rawData: unknown) =>
  handleServerAction(
    getReprovasPorPerguntaSchema,
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

      // Construir filtro de base da equipe se baseId for fornecido
      const whereBase = data.baseId
        ? {
            turno: {
              equipe: {
                EquipeBaseHistorico: {
                  some: {
                    baseId: data.baseId,
                    dataFim: null, // Base ativa (sem dataFim)
                  },
                },
              },
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
          ...whereBase,
        },
        include: {
          checklistResposta: {
            include: {
              pergunta: true,
            },
          },
        },
      });

      // Agrupar por pergunta e contar
      const reprovasPorPergunta = new Map<
        number,
        { perguntaId: number; perguntaNome: string; quantidade: number }
      >();

      for (const pendencia of pendencias) {
        const perguntaId = pendencia.checklistResposta.pergunta.id;
        const perguntaNome = pendencia.checklistResposta.pergunta.nome;

        if (reprovasPorPergunta.has(perguntaId)) {
          const atual = reprovasPorPergunta.get(perguntaId)!;
          atual.quantidade += 1;
        } else {
          reprovasPorPergunta.set(perguntaId, {
            perguntaId,
            perguntaNome,
            quantidade: 1,
          });
        }
      }

      // Converter para array e ordenar por quantidade (decrescente)
      const resultado = Array.from(reprovasPorPergunta.values()).sort(
        (a, b) => b.quantidade - a.quantidade
      );

      return resultado;
    },
    rawData,
    { entityName: 'ReprovasPorPergunta', actionType: 'read' }
  );
