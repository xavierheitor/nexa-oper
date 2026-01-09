/**
 * Server Action para buscar turnos abertos com filtros e estatísticas
 *
 * Esta action aplica filtros no servidor e retorna:
 * - Lista de turnos filtrados
 * - Estatísticas agregadas (total, por base)
 * - Total de turnos diários
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { getTodayDateRange } from '@/lib/utils/dateHelpers';

const turnosAbertosComStatsSchema = z.object({
  filtroVeiculo: z.string().optional(),
  filtroEquipe: z.string().optional(),
  filtroEletricista: z.string().optional(),
  filtroBase: z.string().optional(),
  filtroTipoEquipe: z.string().optional(),
});

interface TurnosAbertosResult {
  turnosAbertos: any[];
  totalDiarios: number;
  stats: {
    total: number;
    totalDiarios: number;
    porBase: Record<string, number>;
  };
}

export const getTurnosAbertosComStats = async (
  params: {
    filtroVeiculo?: string;
    filtroEquipe?: string;
    filtroEletricista?: string;
    filtroBase?: string;
    filtroTipoEquipe?: string;
  } = {}
) =>
  handleServerAction(
    turnosAbertosComStatsSchema,
    async () => {
      const { inicio: inicioHoje, fim: fimHoje } = getTodayDateRange();

      // Construir WHERE clause base para turnos abertos
      const whereAbertos: any = {
        deletedAt: null,
        dataFim: null, // Apenas turnos abertos
      };

      // Construir WHERE clause para todos os turnos do dia
      const whereTodosDia: any = {
        deletedAt: null,
        dataInicio: {
          gte: inicioHoje,
          lte: fimHoje,
        },
      };

      // Aplicar filtros de veículo
      if (params.filtroVeiculo) {
        const filtro = params.filtroVeiculo.toLowerCase();
        whereAbertos.veiculo = {
          OR: [
            { placa: { contains: filtro, mode: 'insensitive' } },
            { modelo: { contains: filtro, mode: 'insensitive' } },
          ],
        };
      }

      // Aplicar filtro de equipe
      if (params.filtroEquipe) {
        whereAbertos.equipe = {
          nome: { contains: params.filtroEquipe, mode: 'insensitive' },
        };
      }

      // Aplicar filtro de base
      if (params.filtroBase) {
        whereAbertos.equipe = {
          ...whereAbertos.equipe,
          EquipeBaseHistorico: {
            some: {
              dataFim: null,
              deletedAt: null,
              base: {
                nome: params.filtroBase,
              },
            },
          },
        };
      }

      // Aplicar filtro de tipo de equipe
      if (params.filtroTipoEquipe) {
        whereAbertos.equipe = {
          ...whereAbertos.equipe,
          tipoEquipe: {
            nome: params.filtroTipoEquipe,
          },
        };
      }

      // Buscar turnos abertos com filtros aplicados
      const turnosAbertos = await prisma.turno.findMany({
        where: whereAbertos,
        include: {
          veiculo: {
            select: {
              placa: true,
              modelo: true,
            },
          },
          equipe: {
            select: {
              nome: true,
              tipoEquipe: {
                select: {
                  nome: true,
                },
              },
              EquipeBaseHistorico: {
                where: {
                  dataFim: null,
                  deletedAt: null,
                },
                select: {
                  base: {
                    select: {
                      nome: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
          TurnoEletricistas: {
            select: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
              motorista: true,
            },
          },
        },
        orderBy: {
          dataInicio: 'desc',
        },
      });

      // Aplicar filtro de eletricista (feito em memória pois é um relacionamento many-to-many)
      let turnosFiltrados = turnosAbertos;
      if (params.filtroEletricista) {
        const filtro = params.filtroEletricista.toLowerCase();
        turnosFiltrados = turnosAbertos.filter(turno =>
          turno.TurnoEletricistas.some(
            te =>
              te.eletricista.nome.toLowerCase().includes(filtro) ||
              te.eletricista.matricula.toLowerCase().includes(filtro)
          )
        );
      }

      // Contar total de turnos do dia (sem filtros)
      const totalDiarios = await prisma.turno.count({
        where: whereTodosDia,
      });

      // Calcular estatísticas agregadas (dos turnos abertos SEM filtros aplicados)
      const todosAbertos = await prisma.turno.findMany({
        where: {
          deletedAt: null,
          dataFim: null,
        },
        select: {
          equipe: {
            select: {
              EquipeBaseHistorico: {
                where: {
                  dataFim: null,
                  deletedAt: null,
                },
                select: {
                  base: {
                    select: {
                      nome: true,
                    },
                  },
                },
                take: 1,
              },
            },
          },
        },
      });

      // Calcular porBase
      const porBase: Record<string, number> = {};
      todosAbertos.forEach(turno => {
        const baseNome =
          turno.equipe?.EquipeBaseHistorico?.[0]?.base?.nome ||
          'Não identificada';
        porBase[baseNome] = (porBase[baseNome] || 0) + 1;
      });

      // Mapear turnos para formato esperado pelo frontend
      const turnosMapeados = turnosFiltrados.map(turno => ({
        id: turno.id,
        dataSolicitacao: turno.dataSolicitacao,
        dataInicio: turno.dataInicio,
        dataFim: turno.dataFim,
        veiculoId: turno.veiculoId,
        veiculoPlaca: turno.veiculo?.placa || 'N/A',
        veiculoModelo: turno.veiculo?.modelo || 'N/A',
        equipeId: turno.equipeId,
        equipeNome: turno.equipe?.nome || 'N/A',
        tipoEquipeNome: turno.equipe?.tipoEquipe?.nome || 'N/A',
        baseNome: turno.equipe?.EquipeBaseHistorico?.[0]?.base?.nome || 'N/A',
        dispositivo: turno.dispositivo || '',
        kmInicio: turno.kmInicio || 0,
        kmFim: turno.KmFim,
        status: turno.dataFim ? 'FECHADO' : 'ABERTO',
        eletricistas: turno.TurnoEletricistas.map(te => ({
          id: te.eletricista.id,
          nome: te.eletricista.nome,
          matricula: te.eletricista.matricula,
          motorista: te.motorista || false,
        })),
      }));

      const result: TurnosAbertosResult = {
        turnosAbertos: turnosMapeados,
        totalDiarios,
        stats: {
          total: todosAbertos.length,
          totalDiarios,
          porBase,
        },
      };

      return result;
    },
    params,
    { entityName: 'Turno', actionType: 'get' }
  );
