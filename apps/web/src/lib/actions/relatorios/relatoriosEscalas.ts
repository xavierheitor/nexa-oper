/**
 * Server Actions para Relatórios de Escalas
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioEscalasFiltroSchema } from '@/lib/schemas/relatoriosSchema';
import { z } from 'zod';

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

/**
 * Schema para buscar escalados por dia específico
 */
const escaladosPorDiaSchema = z.object({
  data: z.string(), // Data no formato ISO string
  baseId: z.number().int().positive().optional(),
  contratoId: z.number().int().positive().optional(),
});

/**
 * Retorna quem está de folga e quem está escalado em um dia específico
 */
export const getEscaladosPorDia = async (rawData?: unknown) =>
  handleServerAction(
    escaladosPorDiaSchema,
    async (filtros) => {
      // Converter data para início e fim do dia
      const dataSelecionada = new Date(filtros.data);
      const inicioDia = new Date(dataSelecionada);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataSelecionada);
      fimDia.setHours(23, 59, 59, 999);

      const whereEscala: any = {
        deletedAt: null,
        // Escala deve estar publicada para aparecer no relatório
        status: 'PUBLICADA',
        // Período da escala deve incluir o dia selecionado
        periodoInicio: { lte: fimDia },
        periodoFim: { gte: inicioDia },
      };

      // Filtro por base
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

      // Filtro por contrato (através da equipe)
      if (filtros.contratoId) {
        whereEscala.equipe = {
          ...whereEscala.equipe,
          contratoId: filtros.contratoId,
          deletedAt: null,
        };
      }

      // Buscar slots do dia específico
      const slots = await prisma.slotEscala.findMany({
        where: {
          deletedAt: null,
          data: {
            gte: inicioDia,
            lte: fimDia,
          },
          escalaEquipePeriodo: whereEscala,
        },
        include: {
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
            },
          },
          escalaEquipePeriodo: {
            include: {
              equipe: {
                select: {
                  id: true,
                  nome: true,
                  contrato: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { estado: 'asc' }, // FOLGA primeiro, depois TRABALHO
          { eletricista: { nome: 'asc' } },
        ],
      });

      // Buscar bases atuais das equipes
      const equipeIds = [...new Set(slots.map((s) => s.escalaEquipePeriodo.equipe.id))];
      const basesEquipes = await prisma.equipeBaseHistorico.findMany({
        where: {
          equipeId: { in: equipeIds },
          dataFim: null,
          deletedAt: null,
        },
        include: {
          base: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      const basePorEquipe = new Map(
        basesEquipes.map((bh) => [bh.equipeId, bh.base])
      );

      // Separar em folga e escalados
      const emFolga = slots
        .filter((slot) => slot.estado === 'FOLGA')
        .map((slot) => ({
          id: slot.eletricista.id,
          nome: slot.eletricista.nome,
          matricula: slot.eletricista.matricula,
        }));

      const escalados = slots
        .filter((slot) => slot.estado === 'TRABALHO')
        .map((slot) => {
          const equipe = slot.escalaEquipePeriodo.equipe;
          const base = basePorEquipe.get(equipe.id);
          return {
            id: slot.eletricista.id,
            nome: slot.eletricista.nome,
            matricula: slot.eletricista.matricula,
            equipeId: equipe.id,
            equipeNome: equipe.nome,
            contratoNome: equipe.contrato.nome,
            baseId: base?.id,
            baseNome: base?.nome,
          };
        });

      // Remover duplicatas (caso um eletricista tenha múltiplos slots no mesmo dia)
      const emFolgaUnicos = Array.from(
        new Map(emFolga.map((item) => [item.id, item])).values()
      );

      const escaladosUnicos = Array.from(
        new Map(escalados.map((item) => [item.id, item])).values()
      );

      return {
        emFolga: emFolgaUnicos,
        escalados: escaladosUnicos,
      };
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

