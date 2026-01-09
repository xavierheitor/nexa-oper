/**
 * Server Action para Estatísticas Diárias de Turnos
 *
 * Esta action recupera estatísticas gerais sobre turnos de uma data específica:
 * - Total de turnos
 * - Total de turnos abertos
 * - Total de turnos fechados
 * - Contagem por Base
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { getDateRangeInSaoPaulo } from '@/lib/utils/dateHelpers';
import { z } from 'zod';

const dailyStatsSchema = z.object({
  date: z.string().optional(),
});

/**
 * Busca estatísticas diárias de turnos
 *
 * @param params Objeto contendo a data opcional
 * @returns Totais e contagem por base
 */
export const getDailyStats = async (params: { date?: string | Date } = {}) =>
  handleServerAction(
    dailyStatsSchema,
    async () => {
      const dateToUse = params.date ? new Date(params.date) : new Date();
      const { inicio, fim } = getDateRangeInSaoPaulo(dateToUse);

      const whereClause = {
        deletedAt: null,
        dataInicio: {
          gte: inicio,
          lte: fim,
        },
      };

      // 1. Calcular Totais (Abertos/Fechados/Total)
      // Usamos aggregate para contar IDs (Total) e dataFim (Fechados - pois conta apenas não-nulos)
      const aggregations = await prisma.turno.aggregate({
        _count: {
          id: true,
          dataFim: true,
        },
        where: whereClause,
      });

      const total = aggregations._count.id;
      const totalFechados = aggregations._count.dataFim;
      const totalAbertos = total - totalFechados;

      // 2. Calcular por Base
      // Precisamos agrupar por equipe e depois mapear para a base histórica
      const turnosPorEquipe = await prisma.turno.groupBy({
        by: ['equipeId'],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      // Buscar as bases históricas para essas equipes
      // Consideramos a base ativa no momento (ou a mais recente)
      const equipeIds = turnosPorEquipe.map(t => t.equipeId);

      const equipesComBase = await prisma.equipe.findMany({
        where: {
          id: { in: equipeIds },
        },
        select: {
          id: true,
          EquipeBaseHistorico: {
            where: {
              dataFim: null,
              deletedAt: null,
            },
            select: {
              base: {
                select: { nome: true },
              },
            },
            take: 1,
          },
        },
      });

      // Mapear EquipeID -> Nome da Base
      const equipeBaseMap = new Map<number, string>();
      equipesComBase.forEach(equipe => {
        const baseNome =
          equipe.EquipeBaseHistorico?.[0]?.base?.nome || 'Não identificada';
        equipeBaseMap.set(equipe.id, baseNome);
      });

      // Agregar contagens por Base
      const porBase: Record<string, number> = {};

      turnosPorEquipe.forEach(item => {
        const baseNome = equipeBaseMap.get(item.equipeId) || 'Não identificada';
        porBase[baseNome] = (porBase[baseNome] || 0) + item._count.id;
      });

      return {
        total,
        totalAbertos,
        totalFechados,
        porBase,
      };
    },
    {
      date:
        params.date instanceof Date ? params.date.toISOString() : params.date,
    },
    { entityName: 'Turno', actionType: 'get' }
  );
