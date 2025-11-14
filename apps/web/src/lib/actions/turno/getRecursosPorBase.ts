/**
 * Server Action para Estatísticas de Recursos por Base
 *
 * Esta action recupera estatísticas sobre recursos (eletricistas, veículos, equipes)
 * agrupados por base para exibição no dashboard.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listBases } from '../base/list';
import { DEFAULT_STATS_PAGE_SIZE, MAX_STATS_ITEMS } from '@/lib/constants/statsLimits';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const recursosPorBaseSchema = z.object({});

/**
 * Interface para dados de recursos por base
 */
export interface RecursosPorBase {
  base: string;
  eletricistas: number;
  veiculos: number;
  equipes: number;
}

/**
 * Busca estatísticas de recursos por base
 *
 * @returns Estatísticas de recursos agrupados por base
 */
export const getRecursosPorBase = async () =>
  handleServerAction(
    recursosPorBaseSchema,
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
      if (resultBases.data.total > MAX_STATS_ITEMS) {
        logger.warn('Limite de bases atingido nas estatísticas de recursos', {
          total: resultBases.data.total,
          limite: MAX_STATS_ITEMS,
          action: 'getRecursosPorBase',
        });
      }

      // 2. Buscar estatísticas de recursos para cada base
      const dados = await Promise.all(
        bases.map(async (base: any) => {
          // Contar veículos lotados na base
          const veiculos = await prisma.veiculoBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              veiculo: {
                deletedAt: null,
              },
            },
          });

          // Contar eletricistas lotados na base
          const eletricistas = await prisma.eletricistaBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              eletricista: {
                deletedAt: null,
              },
            },
          });

          // Contar equipes lotadas na base
          const equipes = await prisma.equipeBaseHistorico.count({
            where: {
              baseId: base.id,
              dataFim: null,
              deletedAt: null,
              equipe: {
                deletedAt: null,
              },
            },
          });

          return {
            base: base.nome,
            eletricistas,
            veiculos,
            equipes,
          };
        })
      );

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );

