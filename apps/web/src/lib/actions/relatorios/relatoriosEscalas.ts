/**
 * Server Actions para Relatórios de Escalas
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioEscalasFiltroSchema } from '@/lib/schemas/relatoriosSchema';

/**
 * Retorna dias trabalhados por eletricista
 */
export const getDiasTrabalhadosPorEletricista = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEscalasFiltroSchema,
    async (filtros) => {
      const whereSlot: any = {
        deletedAt: null,
        estado: 'TRABALHO',
      };

      if (filtros.dataInicio && filtros.dataFim) {
        whereSlot.data = {
          gte: new Date(filtros.dataInicio),
          lte: new Date(filtros.dataFim),
        };
      }

      const whereEscala: any = {
        deletedAt: null,
      };

      if (filtros.status) {
        whereEscala.status = filtros.status;
      }

      if (filtros.equipeId) {
        whereEscala.equipeId = filtros.equipeId;
      }

      if (filtros.baseId) {
        whereEscala.equipe = {
          EquipeBaseHistorico: {
            some: {
              baseId: filtros.baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
        };
      }

      whereSlot.escalaEquipePeriodo = whereEscala;

      // Buscar slots de trabalho
      const slots = await prisma.slotEscala.groupBy({
        by: ['eletricistaId'],
        _count: {
          id: true,
        },
        where: whereSlot,
      });

      // Buscar nomes dos eletricistas
      const eletricistaIds = slots.map((s) => s.eletricistaId);
      const eletricistas = await prisma.eletricista.findMany({
        where: {
          id: { in: eletricistaIds },
          deletedAt: null,
        },
        select: {
          id: true,
          nome: true,
        },
      });

      const eletricistasMap = new Map(eletricistas.map((e) => [e.id, e.nome]));

      return slots
        .map((slot) => ({
          eletricista: eletricistasMap.get(slot.eletricistaId) || 'Desconhecido',
          diasTrabalhados: slot._count.id,
        }))
        .sort((a, b) => b.diasTrabalhados - a.diasTrabalhados)
        .slice(0, 20); // Top 20
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna evolução de faltas por período
 */
export const getFaltasPorPeriodo = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEscalasFiltroSchema,
    async (filtros) => {
      const whereEvento: any = {
        deletedAt: null,
        tipo: 'FALTA',
      };

      if (filtros.dataInicio && filtros.dataFim) {
        whereEvento.registradoEm = {
          gte: new Date(filtros.dataInicio),
          lte: new Date(filtros.dataFim),
        };
      }

      if (filtros.equipeId || filtros.baseId) {
        const whereSlot: any = {
          deletedAt: null,
        };

        if (filtros.equipeId || filtros.baseId) {
          whereSlot.escalaEquipePeriodo = {
            deletedAt: null,
          };

          if (filtros.equipeId) {
            whereSlot.escalaEquipePeriodo.equipeId = filtros.equipeId;
          }

          if (filtros.baseId) {
            whereSlot.escalaEquipePeriodo.equipe = {
              EquipeBaseHistorico: {
                some: {
                  baseId: filtros.baseId,
                  dataFim: null,
                  deletedAt: null,
                },
              },
            };
          }
        }

        whereEvento.slotEscala = whereSlot;
      }

      const eventos = await prisma.eventoCobertura.findMany({
        where: whereEvento,
        select: {
          registradoEm: true,
        },
        orderBy: {
          registradoEm: 'asc',
        },
      });

      // Agrupar por data
      const porData: Record<string, number> = {};

      eventos.forEach((evento) => {
        const data = evento.registradoEm.toISOString().split('T')[0];
        if (!porData[data]) {
          porData[data] = 0;
        }
        porData[data]++;
      });

      return Object.entries(porData).map(([data, quantidade]) => ({
        data,
        quantidade,
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna comparação entre trabalho, folga e falta
 */
export const getComparacaoFolgaTrabalho = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEscalasFiltroSchema,
    async (filtros) => {
      const whereSlot: any = {
        deletedAt: null,
      };

      if (filtros.dataInicio && filtros.dataFim) {
        whereSlot.data = {
          gte: new Date(filtros.dataInicio),
          lte: new Date(filtros.dataFim),
        };
      }

      const whereEscala: any = {
        deletedAt: null,
      };

      if (filtros.status) {
        whereEscala.status = filtros.status;
      }

      if (filtros.equipeId) {
        whereEscala.equipeId = filtros.equipeId;
      }

      if (filtros.baseId) {
        whereEscala.equipe = {
          EquipeBaseHistorico: {
            some: {
              baseId: filtros.baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
        };
      }

      whereSlot.escalaEquipePeriodo = whereEscala;

      // Contar por estado
      const trabalho = await prisma.slotEscala.count({
        where: { ...whereSlot, estado: 'TRABALHO' },
      });

      const folga = await prisma.slotEscala.count({
        where: { ...whereSlot, estado: 'FOLGA' },
      });

      const falta = await prisma.slotEscala.count({
        where: { ...whereSlot, estado: 'FALTA' },
      });

      return [
        { tipo: 'Trabalho', quantidade: trabalho },
        { tipo: 'Folga', quantidade: folga },
        { tipo: 'Falta', quantidade: falta },
      ];
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna estatísticas gerais de escalas
 */
export const getEstatisticasEscalas = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEscalasFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.dataInicio && filtros.dataFim) {
        where.periodoInicio = { gte: new Date(filtros.dataInicio) };
        where.periodoFim = { lte: new Date(filtros.dataFim) };
      }

      if (filtros.status) {
        where.status = filtros.status;
      }

      if (filtros.equipeId) {
        where.equipeId = filtros.equipeId;
      }

      if (filtros.baseId) {
        where.equipe = {
          EquipeBaseHistorico: {
            some: {
              baseId: filtros.baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
        };
      }

      // Contar escalas por status
      const totalRascunho = await prisma.escalaEquipePeriodo.count({
        where: { ...where, status: 'RASCUNHO' },
      });

      const totalPublicada = await prisma.escalaEquipePeriodo.count({
        where: { ...where, status: 'PUBLICADA' },
      });

      const totalArquivada = await prisma.escalaEquipePeriodo.count({
        where: { ...where, status: 'ARQUIVADA' },
      });

      return {
        porStatus: [
          { status: 'Rascunho', quantidade: totalRascunho },
          { status: 'Publicada', quantidade: totalPublicada },
          { status: 'Arquivada', quantidade: totalArquivada },
        ],
        total: totalRascunho + totalPublicada + totalArquivada,
      };
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

