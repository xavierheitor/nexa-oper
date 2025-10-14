/**
 * Server Actions para Relatórios de Veículos
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioVeiculosFiltroSchema } from '@/lib/schemas/relatoriosSchema';
import { z } from 'zod';

/**
 * Retorna distribuição de veículos por tipo
 */
export const getVeiculosPorTipo = async (rawData?: unknown) =>
  handleServerAction(
    relatorioVeiculosFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.baseId) {
        where.VeiculoBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const veiculos = await prisma.veiculo.findMany({
        where,
        include: {
          tipoVeiculo: true,
        },
      });

      // Agrupar por tipo
      const porTipo = veiculos.reduce((acc, veiculo) => {
        const tipo = veiculo.tipoVeiculo.nome;
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

/**
 * Retorna distribuição de veículos por lotação (base)
 */
export const getVeiculosPorLotacao = async (rawData?: unknown) =>
  handleServerAction(
    relatorioVeiculosFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.tipoVeiculoId) {
        where.tipoVeiculoId = filtros.tipoVeiculoId;
      }

      // Buscar veículos com lotação atual
      const veiculos = await prisma.veiculo.findMany({
        where,
        include: {
          VeiculoBaseHistorico: {
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

      veiculos.forEach((veiculo) => {
        const lotacaoAtual = veiculo.VeiculoBaseHistorico[0];
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
 * Retorna distribuição de veículos por marca/modelo
 */
export const getVeiculosPorMarca = async (rawData?: unknown) =>
  handleServerAction(
    relatorioVeiculosFiltroSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
      };

      if (filtros.contratoId) {
        where.contratoId = filtros.contratoId;
      }

      if (filtros.tipoVeiculoId) {
        where.tipoVeiculoId = filtros.tipoVeiculoId;
      }

      if (filtros.baseId) {
        where.VeiculoBaseHistorico = {
          some: {
            baseId: filtros.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const veiculos = await prisma.veiculo.findMany({
        where,
        select: {
          modelo: true,
        },
      });

      // Agrupar por modelo
      const porModelo = veiculos.reduce((acc, veiculo) => {
        const modelo = veiculo.modelo;
        if (!acc[modelo]) {
          acc[modelo] = 0;
        }
        acc[modelo]++;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(porModelo)
        .map(([modelo, quantidade]) => ({
          modelo,
          quantidade,
        }))
        .sort((a, b) => b.quantidade - a.quantidade);
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

