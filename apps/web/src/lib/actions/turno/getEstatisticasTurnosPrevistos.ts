/**
 * Server Action para buscar Estatísticas de Turnos Previstos
 *
 * Calcula estatísticas agregadas dos turnos previstos, incluindo
 * totais, aderência e agrupamento por tipo de equipe.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import type { EstatisticasTurnosPrevistos } from '@/lib/types/turnoPrevisto';

/**
 * Calcula estatísticas dos turnos previstos para hoje
 *
 * @returns Estatísticas agregadas incluindo totais e agrupamento por tipo de equipe
 */
export const getEstatisticasTurnosPrevistos = async () =>
  handleServerAction(
    z.object({}), // Sem parâmetros, sempre busca hoje
    async () => {
      // Reutilizar a mesma lógica de getTurnosPrevistosHoje
      // Para evitar duplicação, vamos fazer a query diretamente aqui
      // (em produção, pode-se criar uma função helper compartilhada)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeFim = new Date(hoje);
      hojeFim.setHours(23, 59, 59, 999);

      // Primeiro buscar escalas válidas (publicadas e com período ativo)
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

      const escalasValidasIds = escalasValidas.map((e) => e.id);

      // Buscar slots de trabalho de hoje das escalas válidas
      // Se não houver escalas válidas, buscar slots vazios (mas ainda precisamos buscar turnos extras depois)
      const slotsAgrupados = escalasValidasIds.length > 0
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

      // Agrupar por equipe
      const equipesComSlots = new Map<
        number,
        {
          equipeId: number;
          tipoEquipeId: number;
          tipoEquipeNome: string;
          eletricistas: Set<number>;
          horarioPrevisto: string | null;
        }
      >();

      for (const slot of slotsAgrupados) {
        const equipeId = slot.escalaEquipePeriodo.equipeId;
        if (!equipesComSlots.has(equipeId)) {
          equipesComSlots.set(equipeId, {
            equipeId,
            tipoEquipeId: slot.escalaEquipePeriodo.equipe.tipoEquipe.id,
            tipoEquipeNome: slot.escalaEquipePeriodo.equipe.tipoEquipe.nome,
            eletricistas: new Set(),
            horarioPrevisto: null,
          });
        }
        const equipe = equipesComSlots.get(equipeId)!;
        equipe.eletricistas.add(slot.eletricistaId);
        if (slot.inicioPrevisto && !equipe.horarioPrevisto) {
          equipe.horarioPrevisto = slot.inicioPrevisto;
        }
      }

      // Filtrar equipes com 2+ eletricistas
      const equipesComTurnoPrevisto = Array.from(
        equipesComSlots.values()
      ).filter((eq) => eq.eletricistas.size >= 2);

      // Buscar turnos abertos hoje
      const turnosAbertos = await prisma.turno.findMany({
        where: {
          dataInicio: {
            gte: hoje,
            lte: hojeFim,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          equipeId: true,
          dataInicio: true,
        },
      });

      const turnosPorEquipe = new Map<number, (typeof turnosAbertos)[0]>();
      for (const turno of turnosAbertos) {
        const existente = turnosPorEquipe.get(turno.equipeId);
        if (!existente || turno.dataInicio > existente.dataInicio) {
          turnosPorEquipe.set(turno.equipeId, turno);
        }
      }

      // Construir dados simplificados para estatísticas
      const turnosPrevistos: Array<{
        tipoEquipeId: number;
        tipoEquipeNome: string;
        horarioPrevisto: string | null;
        status: 'ADERENTE' | 'NAO_ADERENTE' | 'NAO_ABERTO';
        dataAbertura?: Date;
      }> = [];

      const equipeIdsSemHorario = equipesComTurnoPrevisto
        .filter((eq) => !eq.horarioPrevisto)
        .map((eq) => eq.equipeId);

      // IMPORTANTE: A página de cadastro usa EquipeTurnoHistorico, não EquipeHorarioVigencia
      // Buscar em EquipeTurnoHistorico primeiro (dataInicio/dataFim ao invés de vigenciaInicio/vigenciaFim)
      const historicosHorarios = equipeIdsSemHorario.length > 0
        ? await prisma.equipeTurnoHistorico.findMany({
            where: {
              equipeId: { in: equipeIdsSemHorario },
              dataInicio: { lte: hojeFim },
              deletedAt: null,
            },
            orderBy: {
              dataInicio: 'desc',
            },
          })
        : [];

      // Também buscar em EquipeHorarioVigencia (para compatibilidade)
      const vigenciaHorarios = equipeIdsSemHorario.length > 0
        ? await prisma.equipeHorarioVigencia.findMany({
            where: {
              equipeId: { in: equipeIdsSemHorario },
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
        const estaVigente = !vigencia.vigenciaFim || vigencia.vigenciaFim >= hoje;

        if (estaVigente && !horarioPorEquipe.has(vigencia.equipeId)) {
          horarioPorEquipe.set(vigencia.equipeId, vigencia.inicioTurnoHora);
        }
      }

      for (const equipe of equipesComTurnoPrevisto) {
        let horarioPrevisto: string | null = equipe.horarioPrevisto;
        if (!horarioPrevisto) {
          horarioPrevisto = horarioPorEquipe.get(equipe.equipeId) || null;
        }

        const turno = turnosPorEquipe.get(equipe.equipeId);
        let status: 'ADERENTE' | 'NAO_ADERENTE' | 'NAO_ABERTO';

        if (!turno) {
          status = 'NAO_ABERTO';
        } else if (!horarioPrevisto) {
          status = 'NAO_ADERENTE';
        } else {
          const { parseTimeToDate, isAderente } = await import(
            '@/lib/utils/turnoPrevistoHelpers'
          );
          const horarioPrevistoDate = parseTimeToDate(horarioPrevisto, hoje);
          status = isAderente(turno.dataInicio, horarioPrevistoDate)
            ? 'ADERENTE'
            : 'NAO_ADERENTE';
        }

        turnosPrevistos.push({
          tipoEquipeId: equipe.tipoEquipeId,
          tipoEquipeNome: equipe.tipoEquipeNome,
          horarioPrevisto,
          status,
          dataAbertura: turno?.dataInicio,
        });
      }

      // Contar turnos extras
      const equipesComTurnoPrevistoIds = new Set(
        equipesComTurnoPrevisto.map((eq) => eq.equipeId)
      );
      const totalTurnosExtras = turnosAbertos.filter(
        (t) => !equipesComTurnoPrevistoIds.has(t.equipeId)
      ).length;

      // Hora atual para cálculo de "até agora"
      const agora = new Date();
      const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // Minutos desde meia-noite

      // Calcular estatísticas (turnosPrevistos não inclui TURNO_EXTRA, só extras já foram contados)
      const totalPrevistosHoje = turnosPrevistos.length;

      const totalAbertos = turnosPrevistos.filter(
        (t) => t.status === 'ADERENTE' || t.status === 'NAO_ADERENTE'
      ).length;

      const totalNaoAbertos = turnosPrevistos.filter(
        (t) => t.status === 'NAO_ABERTO'
      ).length;

      const totalAderentes = turnosPrevistos.filter(
        (t) => t.status === 'ADERENTE'
      ).length;

      const totalNaoAderentes = turnosPrevistos.filter(
        (t) => t.status === 'NAO_ADERENTE'
      ).length;

      // Calcular "previstos até agora" e "abertos até agora"
      let previstosAteAgora = 0;
      let abertosAteAgora = 0;

      for (const turno of turnosPrevistos) {

        if (turno.horarioPrevisto) {
          // Converter horário para minutos desde meia-noite
          const [hours, minutes] = turno.horarioPrevisto
            .split(':')
            .map(Number);
          const minutosPrevistos = hours * 60 + minutes;

          if (minutosPrevistos <= horaAtual) {
            previstosAteAgora++;
            if (
              turno.status === 'ADERENTE' ||
              turno.status === 'NAO_ADERENTE'
            ) {
              abertosAteAgora++;
            }
          }
        } else {
          // Se não tem horário previsto, considerar como previsto até agora
          previstosAteAgora++;
          if (
            turno.status === 'ADERENTE' ||
            turno.status === 'NAO_ADERENTE'
          ) {
            abertosAteAgora++;
          }
        }
      }

      // Agrupar por tipo de equipe
      const porTipoEquipeMap = new Map<
        number,
        {
          tipoEquipeId: number;
          tipoEquipeNome: string;
          previstos: number;
          abertos: number;
          naoAbertos: number;
        }
      >();

      for (const turno of turnosPrevistos) {
        if (!porTipoEquipeMap.has(turno.tipoEquipeId)) {
          porTipoEquipeMap.set(turno.tipoEquipeId, {
            tipoEquipeId: turno.tipoEquipeId,
            tipoEquipeNome: turno.tipoEquipeNome,
            previstos: 0,
            abertos: 0,
            naoAbertos: 0,
          });
        }

        const tipoEquipe = porTipoEquipeMap.get(turno.tipoEquipeId)!;
        tipoEquipe.previstos++;

        if (turno.status === 'ADERENTE' || turno.status === 'NAO_ADERENTE') {
          tipoEquipe.abertos++;
        } else if (turno.status === 'NAO_ABERTO') {
          tipoEquipe.naoAbertos++;
        }
      }

      const porTipoEquipe = Array.from(porTipoEquipeMap.values()).sort(
        (a, b) => a.tipoEquipeNome.localeCompare(b.tipoEquipeNome)
      );

      const estatisticas: EstatisticasTurnosPrevistos = {
        totalPrevistosHoje,
        totalAbertos,
        totalNaoAbertos,
        totalAderentes,
        totalNaoAderentes,
        totalTurnosExtras,
        previstosAteAgora,
        abertosAteAgora,
        porTipoEquipe,
      };

      return estatisticas;
    },
    {},
    { entityName: 'TurnoPrevisto', actionType: 'get' }
  );

