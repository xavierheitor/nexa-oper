/**
 * Server Action para buscar Turnos Previstos baseado em Escalas
 *
 * Esta action identifica turnos previstos baseado em escalas publicadas,
 * comparando com turnos reais abertos e calculando aderência.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import type { TurnoPrevisto } from '@/lib/types/turnoPrevisto';
import {
  parseTimeToDate,
  calculateMinutesDifference,
  isAderente,
} from '@/lib/utils/turnoPrevistoHelpers';

/**
 * Busca turnos previstos para hoje baseado em escalas publicadas
 *
 * @returns Lista de turnos previstos com status (aderente, não aderente, não aberto, turno extra)
 */
export const getTurnosPrevistosHoje = async () =>
  handleServerAction(
    z.object({}), // Sem parâmetros, sempre busca hoje
    async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeFim = new Date(hoje);
      hojeFim.setHours(23, 59, 59, 999);

      // 1. Primeiro buscar escalas válidas (publicadas e com período ativo)
      // periodoFim é obrigatório no schema, então só verificamos se >= hoje
      const escalasValidas = await prisma.escalaEquipePeriodo.findMany({
        where: {
          status: 'PUBLICADA',
          periodoInicio: { lte: hojeFim },
          periodoFim: { gte: hoje },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      const escalasValidasIds = escalasValidas.map(e => e.id);

      // 2. Buscar slots de trabalho de hoje das escalas válidas
      // Se não houver escalas válidas, buscar slots vazios (mas ainda precisamos buscar turnos extras depois)
      const slotsAgrupados =
        escalasValidasIds.length > 0
          ? await prisma.slotEscala.findMany({
              where: {
                estado: 'TRABALHO',
                data: {
                  gte: hoje,
                  lte: hojeFim,
                },
                escalaEquipePeriodoId: { in: escalasValidasIds },
                deletedAt: null,
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
            })
          : [];

      // 2. Agrupar slots por equipe e contar eletricistas
      const equipesComSlots = new Map<
        number,
        {
          equipeId: number;
          equipeNome: string;
          tipoEquipeId: number;
          tipoEquipeNome: string;
          slots: typeof slotsAgrupados;
          eletricistas: Set<number>;
          inicioPrevisto: string | null; // Horário do slot se tiver
        }
      >();

      for (const slot of slotsAgrupados) {
        const equipeId = slot.escalaEquipePeriodo.equipeId;
        if (!equipesComSlots.has(equipeId)) {
          equipesComSlots.set(equipeId, {
            equipeId,
            equipeNome: slot.escalaEquipePeriodo.equipe.nome,
            tipoEquipeId: slot.escalaEquipePeriodo.equipe.tipoEquipe.id,
            tipoEquipeNome: slot.escalaEquipePeriodo.equipe.tipoEquipe.nome,
            slots: [],
            eletricistas: new Set(),
            inicioPrevisto: null,
          });
        }
        const equipe = equipesComSlots.get(equipeId)!;
        equipe.slots.push(slot);
        equipe.eletricistas.add(slot.eletricistaId);

        // Se o slot tem horário previsto, usar (prioridade)
        if (slot.inicioPrevisto && !equipe.inicioPrevisto) {
          equipe.inicioPrevisto = slot.inicioPrevisto;
        }
      }

      // 3. Filtrar apenas equipes com 2+ eletricistas
      const equipesComTurnoPrevisto = Array.from(
        equipesComSlots.values()
      ).filter(eq => eq.eletricistas.size >= 2);

      // 4. Buscar horários de vigência e BASE ATUAL das equipes
      const equipeIdsSemHorario = equipesComTurnoPrevisto.map(
        eq => eq.equipeId
      );

      // Buscar base atual (EquipeBaseHistorico)
      const historicoBases =
        equipeIdsSemHorario.length > 0
          ? await prisma.equipeBaseHistorico.findMany({
              where: {
                equipeId: { in: equipeIdsSemHorario },
                dataFim: null,
                deletedAt: null,
              },
              include: {
                base: true,
              },
              orderBy: {
                dataInicio: 'desc',
              },
            })
          : [];

      const basePorEquipe = new Map<number, string>();
      for (const hist of historicoBases) {
        if (!basePorEquipe.has(hist.equipeId)) {
          basePorEquipe.set(hist.equipeId, hist.base.nome);
        }
      }

      // Buscar horários vigentes (apenas para quem não tem horário no slot)
      const equipeIdsSemHorarioSlot = equipesComTurnoPrevisto
        .filter(eq => !eq.inicioPrevisto)
        .map(eq => eq.equipeId);

      // IMPORTANTE: A página de cadastro usa EquipeTurnoHistorico, não EquipeHorarioVigencia
      // Buscar em EquipeTurnoHistorico primeiro (dataInicio/dataFim ao invés de vigenciaInicio/vigenciaFim)
      const historicosHorarios =
        equipeIdsSemHorarioSlot.length > 0
          ? await prisma.equipeTurnoHistorico.findMany({
              where: {
                equipeId: { in: equipeIdsSemHorarioSlot },
                dataInicio: { lte: hojeFim },
                deletedAt: null,
              },
              orderBy: {
                dataInicio: 'desc',
              },
            })
          : [];

      // Também buscar em EquipeHorarioVigencia (para compatibilidade)
      const vigenciaHorarios =
        equipeIdsSemHorarioSlot.length > 0
          ? await prisma.equipeHorarioVigencia.findMany({
              where: {
                equipeId: { in: equipeIdsSemHorarioSlot },
                vigenciaInicio: { lte: hojeFim },
                deletedAt: null,
              },
              orderBy: {
                vigenciaInicio: 'desc',
              },
            })
          : [];

      // Filtrar em memória para pegar apenas os que estão vigentes hoje
      // e pegar o mais recente por equipe (priorizar EquipeTurnoHistorico)
      const horarioPorEquipe = new Map<number, string>();

      // Primeiro processar EquipeTurnoHistorico (prioridade)
      for (const historico of historicosHorarios) {
        // Verificar se está vigente (dataFim null ou >= hoje)
        const estaVigente = !historico.dataFim || historico.dataFim >= hoje;

        if (estaVigente && !horarioPorEquipe.has(historico.equipeId)) {
          horarioPorEquipe.set(historico.equipeId, historico.inicioTurnoHora);
        }
      }

      // Depois processar EquipeHorarioVigencia (fallback se não encontrou no histórico)
      for (const vigencia of vigenciaHorarios) {
        // Verificar se está vigente (vigenciaFim null ou >= hoje)
        const estaVigente =
          !vigencia.vigenciaFim || vigencia.vigenciaFim >= hoje;

        if (estaVigente && !horarioPorEquipe.has(vigencia.equipeId)) {
          horarioPorEquipe.set(vigencia.equipeId, vigencia.inicioTurnoHora);
        }
      }

      // 5. Buscar turnos abertos hoje com eletricistas
      const turnosAbertos = await prisma.turno.findMany({
        where: {
          dataInicio: {
            gte: hoje,
            lte: hojeFim,
          },
          deletedAt: null,
        },
        include: {
          TurnoEletricistas: {
            where: {
              deletedAt: null,
            },
            include: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
            },
          },
        },
      });

      // Criar mapa de equipe -> turno (pegar o mais recente se houver múltiplos)
      const turnosPorEquipe = new Map<number, (typeof turnosAbertos)[0]>();
      for (const turno of turnosAbertos) {
        const existente = turnosPorEquipe.get(turno.equipeId);
        if (!existente || turno.dataInicio > existente.dataInicio) {
          turnosPorEquipe.set(turno.equipeId, turno);
        }
      }

      // 6. Construir lista de turnos previstos com status
      const turnosPrevistos: TurnoPrevisto[] = [];

      for (const equipe of equipesComTurnoPrevisto) {
        // Determinar horário previsto (slot > vigência > null)
        let horarioPrevisto: string | null = equipe.inicioPrevisto;
        if (!horarioPrevisto) {
          horarioPrevisto = horarioPorEquipe.get(equipe.equipeId) || null;
        }

        // Buscar turno aberto da equipe
        const turno = turnosPorEquipe.get(equipe.equipeId);

        // Coletar eletricistas únicos
        const eletricistasMap = new Map<
          number,
          { id: number; nome: string; matricula: string }
        >();
        for (const slot of equipe.slots) {
          if (!eletricistasMap.has(slot.eletricistaId)) {
            eletricistasMap.set(slot.eletricistaId, {
              id: slot.eletricista.id,
              nome: slot.eletricista.nome,
              matricula: slot.eletricista.matricula,
            });
          }
        }

        const eletricistas = Array.from(eletricistasMap.values());

        // Buscar eletricistas que abriram o turno (se houver)
        let eletricistasQueAbriram:
          | Array<{ id: number; nome: string; matricula: string }>
          | undefined;
        if (turno && turno.TurnoEletricistas) {
          eletricistasQueAbriram = turno.TurnoEletricistas.map(te => ({
            id: te.eletricista.id,
            nome: te.eletricista.nome,
            matricula: te.eletricista.matricula,
          }));
        }

        let status: TurnoPrevisto['status'];
        let diferencaMinutos: number | undefined;
        let dataAbertura: Date | undefined;
        let turnoId: number | undefined;

        if (!turno) {
          // Não abriu
          status = 'NAO_ABERTO';
        } else if (!horarioPrevisto) {
          // Abriu mas não tem horário previsto - considerar não aderente
          status = 'NAO_ADERENTE';
          dataAbertura = turno.dataInicio;
          turnoId = turno.id;
        } else {
          // Abriu - calcular aderência
          const horarioPrevistoDate = parseTimeToDate(horarioPrevisto, hoje);
          diferencaMinutos = calculateMinutesDifference(
            turno.dataInicio,
            horarioPrevistoDate
          );

          if (isAderente(turno.dataInicio, horarioPrevistoDate)) {
            status = 'ADERENTE';
          } else {
            status = 'NAO_ADERENTE';
          }
          dataAbertura = turno.dataInicio;
          turnoId = turno.id;
        }

        const turnoPrevistoItem = {
          equipeId: equipe.equipeId,
          equipeNome: equipe.equipeNome,
          tipoEquipeId: equipe.tipoEquipeId,
          tipoEquipeNome: equipe.tipoEquipeNome,
          baseNome: basePorEquipe.get(equipe.equipeId) || null,
          horarioPrevisto,
          eletricistas,
          eletricistasQueAbriram,
          status,
          turnoId,
          dataAbertura,
          diferencaMinutos,
        };

        turnosPrevistos.push(turnoPrevistoItem);
      }

      // 7. Adicionar turnos extras (turnos abertos que não estão na escala)
      const equipesComTurnoPrevistoIds = new Set(
        equipesComTurnoPrevisto.map(eq => eq.equipeId)
      );

      // Buscar informações das equipes dos turnos extras
      const turnosExtras = turnosAbertos.filter(
        t => !equipesComTurnoPrevistoIds.has(t.equipeId)
      );

      if (turnosExtras.length > 0) {
        const equipeIdsExtras = turnosExtras.map(t => t.equipeId);

        // Buscar bases para turnos extras também
        const historicoBasesExtras = await prisma.equipeBaseHistorico.findMany({
          where: {
            equipeId: { in: equipeIdsExtras },
            dataFim: null,
            deletedAt: null,
          },
          include: {
            base: true,
          },
          orderBy: {
            dataInicio: 'desc',
          },
        });

        const baseExtrasPorEquipe = new Map<number, string>();
        for (const hist of historicoBasesExtras) {
          if (!baseExtrasPorEquipe.has(hist.equipeId)) {
            baseExtrasPorEquipe.set(hist.equipeId, hist.base.nome);
          }
        }

        const equipesExtras = await prisma.equipe.findMany({
          where: {
            id: { in: equipeIdsExtras },
            deletedAt: null,
          },
          include: {
            tipoEquipe: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        });

        const equipesExtrasMap = new Map(equipesExtras.map(e => [e.id, e]));

        for (const turnoExtra of turnosExtras) {
          const equipe = equipesExtrasMap.get(turnoExtra.equipeId);
          if (equipe) {
            // Buscar eletricistas do turno extra
            const turnoCompleto = await prisma.turno.findUnique({
              where: { id: turnoExtra.id },
              include: {
                TurnoEletricistas: {
                  include: {
                    eletricista: {
                      select: {
                        id: true,
                        nome: true,
                        matricula: true,
                      },
                    },
                  },
                },
              },
            });

            const eletricistas =
              turnoCompleto?.TurnoEletricistas.map(te => ({
                id: te.eletricista.id,
                nome: te.eletricista.nome,
                matricula: te.eletricista.matricula,
              })) || [];

            turnosPrevistos.push({
              equipeId: equipe.id,
              equipeNome: equipe.nome,
              tipoEquipeId: equipe.tipoEquipe.id,
              tipoEquipeNome: equipe.tipoEquipe.nome,
              baseNome: baseExtrasPorEquipe.get(equipe.id) || null,
              horarioPrevisto: null,
              eletricistas,
              status: 'TURNO_EXTRA',
              turnoId: turnoExtra.id,
              dataAbertura: turnoExtra.dataInicio,
            });
          }
        }
      }

      // 8. Ordenar por horário previsto (nulls por último)
      turnosPrevistos.sort((a, b) => {
        if (!a.horarioPrevisto && !b.horarioPrevisto) return 0;
        if (!a.horarioPrevisto) return 1;
        if (!b.horarioPrevisto) return -1;
        return a.horarioPrevisto.localeCompare(b.horarioPrevisto);
      });

      return turnosPrevistos;
    },
    {},
    { entityName: 'TurnoPrevisto', actionType: 'get' }
  );
