/**
 * Server Action para Estatísticas de Turnos por Base
 *
 * Esta action recupera estatísticas sobre turnos de uma data específica,
 * agrupados por base da equipe e tipo de equipe (empilhado).
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { listBases } from '../base/list';
import { listTiposEquipe } from '../tipoEquipe/list';
import { getDateRangeInSaoPaulo } from '@/lib/utils/dateHelpers';
import { z } from 'zod';

const turnoStatsByBaseSchema = z.object({
  date: z.string().optional(),
});

/**
 * Busca estatísticas de turnos do dia por base e tipo de equipe (empilhado)
 *
 * @param params Objeto contendo a data opcional
 * @returns Estatísticas de turnos agrupados por base e tipo de equipe
 */
export const getStatsByBase = async (params: { date?: string | Date } = {}) =>
  handleServerAction(
    turnoStatsByBaseSchema,
    async () => {
      const dateToUse = params.date ? new Date(params.date) : new Date();
      const { inicio, fim } = getDateRangeInSaoPaulo(dateToUse);

      // 1. Buscar todas as bases
      const resultBases = await listBases({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!resultBases.success || !resultBases.data) {
        throw new Error('Erro ao buscar bases');
      }

      const bases = resultBases.data.data || [];

      // 2. Buscar todos os tipos de equipe
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!resultTipos.success || !resultTipos.data) {
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const tiposEquipe = resultTipos.data.data || [];

      // 3. Buscar turnos do dia (Selecionando apenas campos necessários)
      const turnos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataInicio: {
            gte: inicio,
            lte: fim,
          },
        },
        select: {
          equipe: {
            select: {
              tipoEquipe: {
                select: { nome: true },
              },
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

        if (
          baseNome &&
          tipoEquipeNome &&
          contagem[baseNome] &&
          contagem[baseNome][tipoEquipeNome] !== undefined
        ) {
          contagem[baseNome][tipoEquipeNome]++;
        }
      });

      // 6. Converter para array formatado (empilhado)
      const dados: Array<{ base: string; tipo: string; quantidade: number }> =
        [];
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
    {
      date:
        params.date instanceof Date ? params.date.toISOString() : params.date,
    },
    { entityName: 'Turno', actionType: 'get' }
  );
