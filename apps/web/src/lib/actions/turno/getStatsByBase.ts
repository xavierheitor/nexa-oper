/**
 * Server Action para Estatísticas de Turnos por Base
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por base da equipe.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listBases } from '../base/list';
import { getTodayDateRange } from '@/lib/utils/dateHelpers';
import { DEFAULT_STATS_PAGE_SIZE, MAX_STATS_ITEMS } from '@/lib/constants/statsLimits';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const turnoStatsByBaseSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por base
 *
 * @returns Estatísticas de turnos agrupados por base
 */
export const getStatsByBase = async () =>
  handleServerAction(
    turnoStatsByBaseSchema,
    async () => {
      // 1. Buscar todas as bases
      const resultBases = await listBases({
        page: 1,
        pageSize: DEFAULT_STATS_PAGE_SIZE,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!resultBases.success || !resultBases.data) {
        throw new Error('Erro ao buscar bases');
      }

      const bases = resultBases.data.data || [];

      // Validação: Verifica se o limite foi atingido
      if (resultBases.data.meta.total > MAX_STATS_ITEMS) {
        logger.warn('Limite de bases atingido nas estatísticas', {
          total: resultBases.data.meta.total,
          limite: MAX_STATS_ITEMS,
          action: 'getStatsByBase',
        });
      }

      // 2. Buscar turnos do dia com relacionamentos de equipe e base
      const { inicio, fim } = getTodayDateRange();

      const turnos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicio,
            lte: fim,
          },
        },
        include: {
          equipe: {
            include: {
              EquipeBaseHistorico: {
                where: {
                  dataFim: null,
                  deletedAt: null,
                },
                include: {
                  base: true,
                },
                take: 1,
              },
            },
          },
        },
      });

      // 3. Inicializar contagem para todas as bases com 0
      const contagem: Record<string, number> = {};
      bases.forEach((base: any) => {
        contagem[base.nome] = 0;
      });

      // 4. Contar turnos por base
      turnos.forEach((turno: any) => {
        const baseNome = turno.equipe?.EquipeBaseHistorico?.[0]?.base?.nome;
        if (baseNome && contagem[baseNome] !== undefined) {
          contagem[baseNome]++;
        }
      });

      // 5. Converter para array formatado
      const dados = bases.map((base: any) => ({
        base: base.nome,
        quantidade: contagem[base.nome] || 0,
      }));

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
