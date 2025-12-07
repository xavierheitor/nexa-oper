/**
 * Server Actions para Relatórios de Turnos
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { relatorioEscalasFiltroSchema } from '@/lib/schemas/relatoriosSchema';
import { z } from 'zod';

/**
 * Schema para filtros de relatório de turnos por período
 */
const relatorioTurnosPorPeriodoSchema = z.object({
  periodoInicio: z.date(),
  periodoFim: z.date(),
  tipoEquipeId: z.number().int().positive().optional(),
  baseId: z.number().int().positive().optional(),
  contratoId: z.number().int().positive().optional(),
});

/**
 * Retorna turnos por período com dados completos para relatório
 */
export const getTurnosPorPeriodo = async (rawData?: unknown) =>
  handleServerAction(
    relatorioTurnosPorPeriodoSchema,
    async (filtros) => {
      const where: any = {
        deletedAt: null,
        dataInicio: {
          gte: filtros.periodoInicio,
          lte: filtros.periodoFim,
        },
      };

      // Filtro por tipo de equipe
      if (filtros.tipoEquipeId) {
        where.equipe = {
          ...where.equipe,
          tipoEquipeId: filtros.tipoEquipeId,
          deletedAt: null,
        };
      }

      // Filtro por base
      if (filtros.baseId) {
        where.equipe = {
          ...where.equipe,
          EquipeBaseHistorico: {
            some: {
              baseId: filtros.baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
          deletedAt: null,
        };
      }

      // Filtro por contrato
      if (filtros.contratoId) {
        where.equipe = {
          ...where.equipe,
          contratoId: filtros.contratoId,
          deletedAt: null,
        };
      }

      // Buscar turnos com todos os relacionamentos necessários
      const turnos = await prisma.turno.findMany({
        where,
        include: {
          veiculo: {
            select: {
              id: true,
              placa: true,
              modelo: true,
            },
          },
          equipe: {
            select: {
              id: true,
              nome: true,
              tipoEquipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          TurnoEletricistas: {
            where: {
              deletedAt: null,
            },
            include: {
              eletricista: {
                include: {
                  cargo: true,
                },
              },
            },
          },
        },
        orderBy: {
          dataInicio: 'asc',
        },
      });

      // Formatar dados para facilitar o uso no frontend
      return turnos.map((turno: any) => ({
        id: turno.id,
        dataInicio: turno.dataInicio,
        dataFim: turno.dataFim,
        placa: turno.veiculo?.placa || 'N/A',
        equipeNome: turno.equipe?.nome || 'N/A',
        tipoEquipeNome: turno.equipe?.tipoEquipe?.nome || 'Sem classificação',
        tipoEquipeId: turno.equipe?.tipoEquipe?.id || null,
        kmInicio: turno.kmInicio || null,
        eletricistas: turno.TurnoEletricistas?.map((te: any) => ({
          id: te.eletricista.id,
          nome: te.eletricista.nome,
          matricula: te.eletricista.matricula,
          cargoNome: te.eletricista.cargo?.nome || null,
        })) || [],
      }));
    },
    rawData,
    { entityName: 'Relatorio', actionType: 'read' }
  );

