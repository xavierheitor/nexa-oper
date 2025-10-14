/**
 * Server Actions para Relatórios de Equipes
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioEquipesFiltroSchema } from '@/lib/schemas/relatoriosSchema';

/**
 * Retorna distribuição de equipes escaladas vs não escaladas
 */
export const getEquipesEscaladas = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEquipesFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.tipoEquipeId) {
        where.tipoEquipeId = filtros.tipoEquipeId;
      }

      if (filtros.baseId) {
        where.EquipeBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const equipes = await prisma.equipe.findMany({
        where,
        include: {
          EscalaEquipePeriodo: {
            where: {
              status: 'PUBLICADA',
              deletedAt: null,
            },
            select: {
              id: true,
            },
          },
        },
      });

      let escaladas = 0;
      let naoEscaladas = 0;

      equipes.forEach((equipe) => {
        if (equipe.EscalaEquipePeriodo.length > 0) {
          escaladas++;
        } else {
          naoEscaladas++;
        }
      });

      return [
        { status: 'Escaladas', quantidade: escaladas },
        { status: 'Não Escaladas', quantidade: naoEscaladas },
      ];
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna distribuição de equipes por horário definido
 */
export const getEquipesPorHorario = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEquipesFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.tipoEquipeId) {
        where.tipoEquipeId = filtros.tipoEquipeId;
      }

      if (filtros.baseId) {
        where.EquipeBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const hoje = new Date();

      const equipes = await prisma.equipe.findMany({
        where,
        include: {
          EquipeTurnoHistorico: {
            where: {
              deletedAt: null,
              OR: [
                { dataFim: null },
                { dataFim: { gte: hoje } },
              ],
              dataInicio: { lte: hoje },
            },
            include: {
              horarioAberturaCatalogo: true,
            },
          },
        },
      });

      // Agrupar por horário
      const porHorario: Record<string, number> = {
        'Sem Horário': 0,
      };

      equipes.forEach((equipe) => {
        if (equipe.EquipeTurnoHistorico.length > 0) {
          const horario = equipe.EquipeTurnoHistorico[0].horarioAberturaCatalogo.nome;
          if (!porHorario[horario]) {
            porHorario[horario] = 0;
          }
          porHorario[horario]++;
        } else {
          porHorario['Sem Horário']++;
        }
      });

      return Object.entries(porHorario).map(([horario, quantidade]) => ({
        horario,
        quantidade,
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna lista de equipes sem horário definido
 */
export const getEquipesSemHorario = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEquipesFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.tipoEquipeId) {
        where.tipoEquipeId = filtros.tipoEquipeId;
      }

      if (filtros.baseId) {
        where.EquipeBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const hoje = new Date();

      const equipes = await prisma.equipe.findMany({
        where,
        include: {
          tipoEquipe: true,
          contrato: true,
          EquipeTurnoHistorico: {
            where: {
              deletedAt: null,
              OR: [
                { dataFim: null },
                { dataFim: { gte: hoje } },
              ],
              dataInicio: { lte: hoje },
            },
          },
          EquipeBaseHistorico: {
            where: {
              dataFim: null,
              deletedAt: null,
            },
            include: {
              base: true,
            },
          },
        },
      });

      // Filtrar apenas equipes sem horário
      const semHorario = equipes.filter(
        (equipe) => equipe.EquipeTurnoHistorico.length === 0
      );

      return semHorario.map((equipe) => ({
        id: equipe.id,
        nome: equipe.nome,
        tipoEquipe: equipe.tipoEquipe.nome,
        contrato: equipe.contrato.nome,
        base: equipe.EquipeBaseHistorico[0]?.base.nome || 'Sem Lotação',
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna distribuição de equipes por tipo
 */
export const getEquipesPorTipo = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEquipesFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.baseId) {
        where.EquipeBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const equipes = await prisma.equipe.findMany({
        where,
        include: {
          tipoEquipe: true,
        },
      });

      // Agrupar por tipo
      const porTipo = equipes.reduce((acc, equipe) => {
        const tipo = equipe.tipoEquipe.nome;
        if (!acc[tipo]) {
          acc[tipo] = 0;
        }
        acc[tipo]++;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(porTipo).map(([tipo, quantidade]) => ({
        tipo,
        quantidade,
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

