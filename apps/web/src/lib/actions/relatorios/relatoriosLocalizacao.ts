/**
 * Server Actions para Relatórios de Localização
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

/**
 * Schema de validação para filtros do relatório de localização
 */
const relatorioLocalizacaoFiltroSchema = z.object({
  periodoInicio: z.date().optional(),
  periodoFim: z.date().optional(),
  baseId: z.number().int().positive().optional(),
  contratoId: z.number().int().positive().optional(),
});

/**
 * Interface para dados de equipe com estatísticas de localização
 */
export interface EquipeLocalizacaoStats {
  equipeId: number;
  equipeNome: string;
  baseNome: string | null;
  contratoNome: string;
  tipoEquipeNome: string;
  totalLocalizacoes: number;
  totalTurnos: number;
  ultimaCaptura: Date | null;
  tempoSemCaptura: number | null; // em minutos
}

/**
 * Retorna equipes com menos registros de localização
 */
export const getEquipesMenosLocalizacoes = async (rawData?: unknown) =>
  handleServerAction(
    relatorioLocalizacaoFiltroSchema,
    async (filtros) => {
      const whereTurno: any = {
        deletedAt: null,
      };

      const whereEquipe: any = {
        deletedAt: null,
      };

      // Filtro por contrato
      if (filtros.contratoId) {
        whereEquipe.contratoId = filtros.contratoId;
      }

      // Filtro por base
      if (filtros.baseId) {
        whereEquipe.EquipeBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            OR: [
              { dataFim: null },
              { dataFim: { gte: filtros.periodoInicio || new Date(0) } },
            ],
            deletedAt: null,
          },
        };
      }

      // Filtro por período nas localizações
      const whereLocalizacao: any = {
        deletedAt: null,
      };

      if (filtros.periodoInicio || filtros.periodoFim) {
        whereLocalizacao.capturedAt = {};
        if (filtros.periodoInicio) {
          whereLocalizacao.capturedAt.gte = filtros.periodoInicio;
        }
        if (filtros.periodoFim) {
          whereLocalizacao.capturedAt.lte = filtros.periodoFim;
        }
      }

      // Buscar todas as equipes com filtros aplicados
      const equipes = await prisma.equipe.findMany({
        where: whereEquipe,
        include: {
          tipoEquipe: {
            select: {
              nome: true,
            },
          },
          contrato: {
            select: {
              nome: true,
            },
          },
          EquipeBaseHistorico: {
            where: {
              deletedAt: null,
              dataFim: null, // Base atual (vigente)
            },
            include: {
              base: {
                select: {
                  nome: true,
                },
              },
            },
            orderBy: {
              dataInicio: 'desc',
            },
            take: 1,
          },
        },
      });

      // Buscar estatísticas de localização por equipe
      const statsPromises = equipes.map(async (equipe) => {
        // Buscar turnos da equipe no período
        const turnos = await prisma.turno.findMany({
          where: {
            ...whereTurno,
            equipeId: equipe.id,
            ...(filtros.periodoInicio || filtros.periodoFim
              ? {
                  dataInicio: {
                    ...(filtros.periodoInicio
                      ? { gte: filtros.periodoInicio }
                      : {}),
                    ...(filtros.periodoFim
                      ? { lte: filtros.periodoFim }
                      : {}),
                  },
                }
              : {}),
          },
          select: {
            id: true,
          },
        });

        const turnoIds = turnos.map((t) => t.id);

        // Contar localizações
        const totalLocalizacoes = await prisma.mobileLocation.count({
          where: {
            ...whereLocalizacao,
            turnoId: { in: turnoIds },
          },
        });

        // Buscar última captura
        const ultimaLocalizacao = await prisma.mobileLocation.findFirst({
          where: {
            ...whereLocalizacao,
            turnoId: { in: turnoIds },
          },
          orderBy: {
            capturedAt: 'desc',
          },
          select: {
            capturedAt: true,
          },
        });

        const ultimaCaptura = ultimaLocalizacao?.capturedAt || null;
        const agora = new Date();
        const tempoSemCaptura =
          ultimaCaptura
            ? Math.floor((agora.getTime() - ultimaCaptura.getTime()) / (1000 * 60))
            : null;

        const baseAtual = equipe.EquipeBaseHistorico[0]?.base?.nome || null;

        return {
          equipeId: equipe.id,
          equipeNome: equipe.nome,
          baseNome: baseAtual,
          contratoNome: equipe.contrato.nome,
          tipoEquipeNome: equipe.tipoEquipe.nome,
          totalLocalizacoes,
          totalTurnos: turnos.length,
          ultimaCaptura,
          tempoSemCaptura,
        };
      });

      const stats = await Promise.all(statsPromises);

      // Ordenar por menor número de localizações
      return stats.sort((a, b) => a.totalLocalizacoes - b.totalLocalizacoes);
    },
    rawData,
    { entityName: 'RelatorioLocalizacao', actionType: 'read' }
  );

/**
 * Retorna equipes com maior tempo sem captura de localização
 */
export const getEquipesMaiorTempoSemCaptura = async (rawData?: unknown) =>
  handleServerAction(
    relatorioLocalizacaoFiltroSchema,
    async (filtros) => {
      const whereTurno: any = {
        deletedAt: null,
      };

      const whereEquipe: any = {
        deletedAt: null,
      };

      // Filtro por contrato
      if (filtros.contratoId) {
        whereEquipe.contratoId = filtros.contratoId;
      }

      // Filtro por base
      if (filtros.baseId) {
        whereEquipe.EquipeBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            OR: [
              { dataFim: null },
              { dataFim: { gte: filtros.periodoInicio || new Date(0) } },
            ],
            deletedAt: null,
          },
        };
      }

      // Filtro por período nas localizações
      const whereLocalizacao: any = {
        deletedAt: null,
      };

      if (filtros.periodoInicio || filtros.periodoFim) {
        whereLocalizacao.capturedAt = {};
        if (filtros.periodoInicio) {
          whereLocalizacao.capturedAt.gte = filtros.periodoInicio;
        }
        if (filtros.periodoFim) {
          whereLocalizacao.capturedAt.lte = filtros.periodoFim;
        }
      }

      // Buscar todas as equipes com filtros aplicados
      const equipes = await prisma.equipe.findMany({
        where: whereEquipe,
        include: {
          tipoEquipe: {
            select: {
              nome: true,
            },
          },
          contrato: {
            select: {
              nome: true,
            },
          },
          EquipeBaseHistorico: {
            where: {
              deletedAt: null,
              dataFim: null, // Base atual (vigente)
            },
            include: {
              base: {
                select: {
                  nome: true,
                },
              },
            },
            orderBy: {
              dataInicio: 'desc',
            },
            take: 1,
          },
        },
      });

      // Buscar estatísticas de localização por equipe
      const statsPromises = equipes.map(async (equipe) => {
        // Buscar turnos da equipe no período
        const turnos = await prisma.turno.findMany({
          where: {
            ...whereTurno,
            equipeId: equipe.id,
            ...(filtros.periodoInicio || filtros.periodoFim
              ? {
                  dataInicio: {
                    ...(filtros.periodoInicio
                      ? { gte: filtros.periodoInicio }
                      : {}),
                    ...(filtros.periodoFim
                      ? { lte: filtros.periodoFim }
                      : {}),
                  },
                }
              : {}),
          },
          select: {
            id: true,
          },
        });

        const turnoIds = turnos.map((t) => t.id);

        // Contar localizações
        const totalLocalizacoes = await prisma.mobileLocation.count({
          where: {
            ...whereLocalizacao,
            turnoId: { in: turnoIds },
          },
        });

        // Buscar última captura
        const ultimaLocalizacao = await prisma.mobileLocation.findFirst({
          where: {
            ...whereLocalizacao,
            turnoId: { in: turnoIds },
          },
          orderBy: {
            capturedAt: 'desc',
          },
          select: {
            capturedAt: true,
          },
        });

        const ultimaCaptura = ultimaLocalizacao?.capturedAt || null;
        const agora = new Date();
        const tempoSemCaptura =
          ultimaCaptura
            ? Math.floor((agora.getTime() - ultimaCaptura.getTime()) / (1000 * 60))
            : null;

        const baseAtual = equipe.EquipeBaseHistorico[0]?.base?.nome || null;

        return {
          equipeId: equipe.id,
          equipeNome: equipe.nome,
          baseNome: baseAtual,
          contratoNome: equipe.contrato.nome,
          tipoEquipeNome: equipe.tipoEquipe.nome,
          totalLocalizacoes,
          totalTurnos: turnos.length,
          ultimaCaptura,
          tempoSemCaptura,
        };
      });

      const stats = await Promise.all(statsPromises);

      // Filtrar apenas equipes que têm turnos mas sem localizações, ou ordenar por maior tempo sem captura
      const statsComTempo = stats
        .filter((s) => s.tempoSemCaptura !== null || s.totalLocalizacoes === 0)
        .sort((a, b) => {
          // Priorizar equipes sem localizações
          if (a.totalLocalizacoes === 0 && b.totalLocalizacoes > 0) return -1;
          if (a.totalLocalizacoes > 0 && b.totalLocalizacoes === 0) return 1;
          // Depois ordenar por maior tempo sem captura
          const tempoA = a.tempoSemCaptura || 0;
          const tempoB = b.tempoSemCaptura || 0;
          return tempoB - tempoA;
        });

      return statsComTempo;
    },
    rawData,
    { entityName: 'RelatorioLocalizacao', actionType: 'read' }
  );

