/**
 * Server Action para Estatísticas de Turnos por Base
 *
 * Esta action recupera estatísticas sobre turnos do dia atual,
 * agrupados por base da equipe e tipo de equipe (empilhado).
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listBases } from '../base/list';
import { listTiposEquipe } from '../tipoEquipe/list';
import { getTodayDateRange } from '@/lib/utils/dateHelpers';
import { DEFAULT_STATS_PAGE_SIZE, MAX_STATS_ITEMS } from '@/lib/constants/statsLimits';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const turnoStatsByBaseSchema = z.object({});

/**
 * Busca estatísticas de turnos do dia por base e tipo de equipe (empilhado)
 *
 * @returns Estatísticas de turnos agrupados por base e tipo de equipe
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
      if (resultBases.data.total > MAX_STATS_ITEMS) {
        logger.warn('Limite de bases atingido nas estatísticas', {
          total: resultBases.data.total,
          limite: MAX_STATS_ITEMS,
          action: 'getStatsByBase',
        });
      }

      // 2. Buscar todos os tipos de equipe
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: DEFAULT_STATS_PAGE_SIZE,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!resultTipos.success || !resultTipos.data) {
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const tiposEquipe = resultTipos.data.data || [];

      // Validação: Verifica se o limite foi atingido
      if (resultTipos.data.total > MAX_STATS_ITEMS) {
        logger.warn('Limite de tipos de equipe atingido nas estatísticas', {
          total: resultTipos.data.total,
          limite: MAX_STATS_ITEMS,
          action: 'getStatsByBase',
        });
      }

      // 3. Buscar turnos do dia com relacionamentos de equipe, tipo de equipe e base
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
              tipoEquipe: true,
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

      // 4. Inicializar contagem: base -> tipo -> quantidade
      const contagem: Record<string, Record<string, number>> = {};
      bases.forEach((base: any) => {
        contagem[base.nome] = {};
        tiposEquipe.forEach((tipo: any) => {
          contagem[base.nome][tipo.nome] = 0;
        });
      });

      // 5. Contar turnos por base e tipo de equipe
      turnos.forEach((turno: any) => {
        const baseNome = turno.equipe?.EquipeBaseHistorico?.[0]?.base?.nome;
        const tipoEquipeNome = turno.equipe?.tipoEquipe?.nome;

        if (baseNome && tipoEquipeNome && contagem[baseNome] && contagem[baseNome][tipoEquipeNome] !== undefined) {
          contagem[baseNome][tipoEquipeNome]++;
        }
      });

      // 6. Converter para array formatado (empilhado)
      const dados: Array<{ base: string; tipo: string; quantidade: number }> = [];
      bases.forEach((base: any) => {
        tiposEquipe.forEach((tipo: any) => {
          dados.push({
            base: base.nome,
            tipo: tipo.nome,
            quantidade: contagem[base.nome][tipo.nome] || 0,
          });
        });
      });

      return dados;
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
