/**
 * Server Actions para Relatórios de Eletricistas
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioEletricistasFiltroSchema } from '@/lib/schemas/relatoriosSchema';

/**
 * Retorna distribuição de eletricistas por lotação (base)
 */
export const getEletricistasPorLotacao = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEletricistasFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.cargoId) {
        where.cargoId = filtros.cargoId;
      }

      if (filtros.estado) {
        where.estado = filtros.estado;
      }

      // Buscar eletricistas com lotação atual
      const eletricistas = await prisma.eletricista.findMany({
        where,
        include: {
          EletricistaBaseHistorico: {
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

      // Agrupar por base
      const porBase: Record<string, number> = {
        'Sem Lotação': 0,
      };

      eletricistas.forEach((eletricista) => {
        const lotacaoAtual = eletricista.EletricistaBaseHistorico[0];
        if (lotacaoAtual && lotacaoAtual.base) {
          const nomeBase = lotacaoAtual.base.nome;
          if (!porBase[nomeBase]) {
            porBase[nomeBase] = 0;
          }
          porBase[nomeBase]++;
        } else {
          porBase['Sem Lotação']++;
        }
      });

      return Object.entries(porBase).map(([base, quantidade]) => ({
        base,
        quantidade,
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna distribuição de eletricistas escalados por tipo de equipe
 */
export const getEletricistasPorTipoEquipe = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEletricistasFiltroSchema,
    async (filtros) => {
      const whereEletricista: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        whereEletricista.contratoId = filtros.contratoId;
      }

      if (filtros.cargoId) {
        whereEletricista.cargoId = filtros.cargoId;
      }

      if (filtros.baseId) {
        whereEletricista.EletricistaBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const whereSlot: any = {
        deletedAt: null,
        escalaEquipePeriodo: {
          status: 'PUBLICADA',
          deletedAt: null,
        },
      };

      if (filtros.dataInicio && filtros.dataFim) {
        whereSlot.data = {
          gte: new Date(filtros.dataInicio),
          lte: new Date(filtros.dataFim),
        };
      }

      // Buscar slots de escalas publicadas
      const slots = await prisma.slotEscala.findMany({
        where: {
          ...whereSlot,
          eletricista: whereEletricista,
        },
        include: {
          escalaEquipePeriodo: {
            include: {
              equipe: {
                include: {
                  tipoEquipe: true,
                },
              },
            },
          },
        },
        distinct: ['eletricistaId', 'escalaEquipePeriodoId'],
      });

      // Agrupar por tipo de equipe
      const porTipo: Record<string, Set<number>> = {};

      slots.forEach((slot) => {
        const tipo = slot.escalaEquipePeriodo.equipe.tipoEquipe.nome;
        if (!porTipo[tipo]) {
          porTipo[tipo] = new Set();
        }
        porTipo[tipo].add(slot.eletricistaId);
      });

      return Object.entries(porTipo).map(([tipo, eletricistaIds]) => ({
        tipo,
        quantidade: eletricistaIds.size,
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna dados detalhados de eletricistas com estatísticas
 */
export const getEletricistasDetalhado = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEletricistasFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.cargoId) {
        where.cargoId = filtros.cargoId;
      }

      if (filtros.estado) {
        where.estado = filtros.estado;
      }

      if (filtros.baseId) {
        where.EletricistaBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const eletricistas = await prisma.eletricista.findMany({
        where,
        include: {
          cargo: true,
          contrato: true,
          EletricistaBaseHistorico: {
            where: {
              dataFim: null,
              deletedAt: null,
            },
            include: {
              base: true,
            },
          },
          SlotEscala: {
            where: {
              deletedAt: null,
              ...(filtros.dataInicio && filtros.dataFim
                ? {
                    data: {
                      gte: new Date(filtros.dataInicio),
                      lte: new Date(filtros.dataFim),
                    },
                  }
                : {}),
            },
            select: {
              estado: true,
              data: true,
            },
          },
        },
      });

      return eletricistas.map((eletricista) => {
        const slots = eletricista.SlotEscala;
        const diasTrabalho = slots.filter((s) => s.estado === 'TRABALHO').length;
        const diasFolga = slots.filter((s) => s.estado === 'FOLGA').length;
        const diasFalta = slots.filter((s) => s.estado === 'FALTA').length;

        return {
          id: eletricista.id,
          nome: eletricista.nome,
          matricula: eletricista.matricula,
          cargo: eletricista.cargo.nome,
          estado: eletricista.estado,
          contrato: eletricista.contrato.nome,
          base: eletricista.EletricistaBaseHistorico[0]?.base.nome || 'Sem Lotação',
          estatisticas: {
            diasTrabalho,
            diasFolga,
            diasFalta,
            totalDias: slots.length,
          },
        };
      });
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

/**
 * Retorna distribuição de eletricistas por cargo
 */
export const getEletricistasPorCargo = async (rawData?: unknown) =>
  handleServerAction(
    relatorioEletricistasFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.baseId) {
        where.EletricistaBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      if (filtros.estado) {
        where.estado = filtros.estado;
      }

      const eletricistas = await prisma.eletricista.findMany({
        where,
        include: {
          cargo: true,
        },
      });

      // Agrupar por cargo
      const porCargo = eletricistas.reduce((acc, eletricista) => {
        const cargo = eletricista.cargo.nome;
        if (!acc[cargo]) {
          acc[cargo] = 0;
        }
        acc[cargo]++;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(porCargo).map(([cargo, quantidade]) => ({
        cargo,
        quantidade,
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

