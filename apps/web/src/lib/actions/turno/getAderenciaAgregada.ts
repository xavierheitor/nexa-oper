/**
 * Server Action para obter aderência de escala agregada
 *
 * Retorna dados agregados de aderência por base, tipo de equipe, etc.
 * com percentuais de aderência e não aderência
 *
 * Calcula diretamente dos dados de escala e turnos, sem depender de snapshot
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const aderenciaAgregadaSchema = z.object({
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
  baseId: z.number().optional(),
  tipoEquipeId: z.number().optional(),
  equipeId: z.number().optional(),
});

export const getAderenciaAgregada = async (rawData: unknown) =>
  handleServerAction(
    aderenciaAgregadaSchema,
    async (data) => {
      const dataInicio = new Date(data.dataInicio);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data.dataFim);
      dataFim.setHours(23, 59, 59, 999);

      // Construir filtros para slots de escala
      const whereSlotsEscalaPeriodo: any = {
        status: 'PUBLICADA',
        deletedAt: null,
      };

      if (data.equipeId) {
        whereSlotsEscalaPeriodo.equipeId = data.equipeId;
      }

      // Construir filtros de equipe (para tipoEquipeId e baseId)
      const whereEquipe: any = {
        deletedAt: null,
      };

      if (data.tipoEquipeId) {
        whereEquipe.tipoEquipeId = data.tipoEquipeId;
      }

      if (data.baseId) {
        whereEquipe.EquipeBaseHistorico = {
          some: {
            baseId: data.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      // Se há filtros de equipe, adicionar ao filtro de escala
      if (Object.keys(whereEquipe).length > 1 || data.tipoEquipeId || data.baseId) {
        whereSlotsEscalaPeriodo.equipe = whereEquipe;
      }

      const whereSlots: any = {
        deletedAt: null,
        data: { gte: dataInicio, lte: dataFim },
        estado: 'TRABALHO',
        escalaEquipePeriodo: whereSlotsEscalaPeriodo,
      };

      // Buscar slots de escala (previstos)
      const slotsEscala = await prisma.slotEscala.findMany({
        where: whereSlots,
        include: {
          escalaEquipePeriodo: {
            include: {
              equipe: {
                include: {
                  tipoEquipe: {
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
      });

      // Buscar turnos abertos no período
      // Nota: TurnoRealizado não tem deletedAt (soft delete)
      const whereTurnosEquipe: any = {
        deletedAt: null, // Filtrar equipes não deletadas
      };

      if (data.tipoEquipeId) {
        whereTurnosEquipe.tipoEquipeId = data.tipoEquipeId;
      }

      if (data.baseId) {
        whereTurnosEquipe.EquipeBaseHistorico = {
          some: {
            baseId: data.baseId,
            dataFim: null,
            deletedAt: null,
          },
        };
      }

      const whereTurnos: any = {
        dataReferencia: { gte: dataInicio, lte: dataFim },
      };

      if (data.equipeId) {
        whereTurnos.equipeId = data.equipeId;
      } else if (data.tipoEquipeId || data.baseId) {
        whereTurnos.equipe = whereTurnosEquipe;
      }

      const turnosAbertos = await prisma.turnoRealizado.findMany({
        where: whereTurnos,
        include: {
          Itens: {
            include: {
              eletricista: {
                select: {
                  id: true,
                },
              },
            },
          },
          equipe: {
            include: {
              tipoEquipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      });

      // Buscar bases das equipes
      const equipeIds = [
        ...new Set([
          ...slotsEscala.map((s) => s.escalaEquipePeriodo.equipeId),
          ...turnosAbertos.map((t) => t.equipeId),
        ]),
      ];

      const basesHistorico = await prisma.equipeBaseHistorico.findMany({
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
        orderBy: {
          dataInicio: 'desc',
        },
      });

      // Mapear base por equipe
      const basePorEquipe = new Map<number, { id: number; nome: string }>();
      basesHistorico.forEach((bh) => {
        if (!basePorEquipe.has(bh.equipeId) && bh.base) {
          basePorEquipe.set(bh.equipeId, {
            id: bh.base.id,
            nome: bh.base.nome,
          });
        }
      });

      // Agrupar slots por equipe e data
      const slotsPorEquipeEData = new Map<string, any[]>();
      slotsEscala.forEach((slot) => {
        const equipeId = slot.escalaEquipePeriodo.equipeId;
        const dataStr = slot.data.toISOString().split('T')[0];
        const key = `${equipeId}-${dataStr}`;
        if (!slotsPorEquipeEData.has(key)) {
          slotsPorEquipeEData.set(key, []);
        }
        slotsPorEquipeEData.get(key)!.push(slot);
      });

      // Agrupar turnos por equipe e data
      const turnosPorEquipeEData = new Map<string, any[]>();
      turnosAbertos.forEach((turno) => {
        const equipeId = turno.equipeId;
        const dataStr = turno.dataReferencia.toISOString().split('T')[0];
        const key = `${equipeId}-${dataStr}`;
        if (!turnosPorEquipeEData.has(key)) {
          turnosPorEquipeEData.set(key, []);
        }
        turnosPorEquipeEData.get(key)!.push(turno);
      });

      // Identificar turnos extras (turnos abertos sem slot correspondente)
      const equipesComSlot = new Set(
        slotsEscala.map((s) => s.escalaEquipePeriodo.equipeId)
      );
      const turnosExtras = turnosAbertos.filter(
        (t) => !equipesComSlot.has(t.equipeId)
      );

      // Agregar por base e tipo de equipe
      const agregados = new Map<
        string,
        {
          baseId: number | null;
          baseNome: string;
          tipoEquipeId: number;
          tipoEquipeNome: string;
          total: number;
          aderente: number;
          naoAderente: number;
          naoAberto: number;
          turnoExtra: number;
        }
      >();

      // Processar slots (turnos previstos)
      slotsPorEquipeEData.forEach((slots, key) => {
        const [equipeIdStr, dataStr] = key.split('-');
        const equipeId = parseInt(equipeIdStr, 10);
        const slot = slots[0]; // Pegar primeiro slot para obter info da equipe
        const equipe = slot.escalaEquipePeriodo.equipe;
        const base = basePorEquipe.get(equipeId);
        const baseId = base?.id || null;
        const baseNome = base?.nome || 'Sem Base';
        const tipoEquipeId = equipe.tipoEquipe?.id || 0;
        const tipoEquipeNome = equipe.tipoEquipe?.nome || 'Sem Tipo';

        const agregadoKey = `${baseId || 'null'}-${tipoEquipeId}`;

        if (!agregados.has(agregadoKey)) {
          agregados.set(agregadoKey, {
            baseId,
            baseNome,
            tipoEquipeId,
            tipoEquipeNome,
            total: 0,
            aderente: 0,
            naoAderente: 0,
            naoAberto: 0,
            turnoExtra: 0,
          });
        }

        const agregado = agregados.get(agregadoKey)!;
        agregado.total++;

        // Verificar se há turno aberto para este dia/equipe
        const turnosDoDia = turnosPorEquipeEData.get(key) || [];
        const eletricistasEscalados = new Set(
          slots.map((s) => s.eletricistaId)
        );
        const eletricistasQueTrabalharam = new Set(
          turnosDoDia.flatMap((t) => t.Itens.map((i) => i.eletricistaId))
        );

        if (turnosDoDia.length === 0) {
          // Não abriu turno
          agregado.naoAberto++;
        } else {
          // Abriu turno - verificar aderência
          // Considera aderente se pelo menos 80% dos eletricistas escalados trabalharam
          const percentualTrabalhou =
            eletricistasEscalados.size > 0
              ? (eletricistasQueTrabalharam.size / eletricistasEscalados.size) *
                100
              : 0;

          if (percentualTrabalhou >= 80) {
            agregado.aderente++;
          } else {
            agregado.naoAderente++;
          }
        }
      });

      // Processar turnos extras
      turnosExtras.forEach((turno) => {
        const equipeId = turno.equipeId;
        const base = basePorEquipe.get(equipeId);
        const baseId = base?.id || null;
        const baseNome = base?.nome || 'Sem Base';
        const tipoEquipeId = turno.equipe.tipoEquipe?.id || 0;
        const tipoEquipeNome = turno.equipe.tipoEquipe?.nome || 'Sem Tipo';

        const agregadoKey = `${baseId || 'null'}-${tipoEquipeId}`;

        if (!agregados.has(agregadoKey)) {
          agregados.set(agregadoKey, {
            baseId,
            baseNome,
            tipoEquipeId,
            tipoEquipeNome,
            total: 0,
            aderente: 0,
            naoAderente: 0,
            naoAberto: 0,
            turnoExtra: 0,
          });
        }

        const agregado = agregados.get(agregadoKey)!;
        agregado.total++;
        agregado.turnoExtra++;
      });

      // Converter para array e calcular percentuais
      const resultado = Array.from(agregados.values())
        .map((agregado) => {
          const percentualAderencia =
            agregado.total > 0
              ? (agregado.aderente / agregado.total) * 100
              : 0;
          const percentualNaoAderencia =
            agregado.total > 0
              ? ((agregado.naoAderente + agregado.naoAberto) /
                  agregado.total) *
                100
              : 0;

          return {
            ...agregado,
            percentualAderencia: Math.round(percentualAderencia * 100) / 100,
            percentualNaoAderencia:
              Math.round(percentualNaoAderencia * 100) / 100,
          };
        })
        .sort((a, b) => {
          // Ordenar por base e depois por tipo de equipe
          if (a.baseNome !== b.baseNome) {
            return a.baseNome.localeCompare(b.baseNome);
          }
          return a.tipoEquipeNome.localeCompare(b.tipoEquipeNome);
        });

      // Calcular totais gerais
      const totais = resultado.reduce(
        (acc, item) => ({
          total: acc.total + item.total,
          aderente: acc.aderente + item.aderente,
          naoAderente: acc.naoAderente + item.naoAderente,
          naoAberto: acc.naoAberto + item.naoAberto,
          turnoExtra: acc.turnoExtra + item.turnoExtra,
        }),
        {
          total: 0,
          aderente: 0,
          naoAderente: 0,
          naoAberto: 0,
          turnoExtra: 0,
        }
      );

      const percentualAderenciaGeral =
        totais.total > 0 ? (totais.aderente / totais.total) * 100 : 0;
      const percentualNaoAderenciaGeral =
        totais.total > 0
          ? ((totais.naoAderente + totais.naoAberto) / totais.total) * 100
          : 0;

      return {
        dados: resultado,
        totais: {
          ...totais,
          percentualAderencia: Math.round(percentualAderenciaGeral * 100) / 100,
          percentualNaoAderencia:
            Math.round(percentualNaoAderenciaGeral * 100) / 100,
        },
      };
    },
    rawData,
    { entityName: 'AderenciaAgregada', actionType: 'get' }
  );

