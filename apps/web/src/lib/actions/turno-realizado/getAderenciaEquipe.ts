/**
 * Server Action para relatório de aderência de equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { prisma } from '../../db/db.service';
import { getAderenciaEquipeSchema } from '../../schemas/aderenciaEquipeSchema';

/**
 * Retorna aderência de equipe (percentual de execução da escala)
 * Considera justificativas de equipe aprovadas que não geram falta
 */
export const getAderenciaEquipe = async (rawData: unknown) =>
  handleServerAction(
    getAderenciaEquipeSchema,
    async (data) => {
      const dataInicio = new Date(data.dataInicio);
      const dataFim = new Date(data.dataFim);

      // Buscar slots da escala (previstos)
      const slotsEscala = await prisma.slotEscala.findMany({
        where: {
          escalaEquipePeriodo: { equipeId: data.equipeId },
          data: { gte: dataInicio, lte: dataFim },
          estado: 'TRABALHO',
        },
        include: {
          eletricista: {
            select: { id: true, nome: true, matricula: true },
          },
        },
      });

      // Buscar turnos realmente abertos pela equipe
      const turnosAbertos = await prisma.turnoRealizado.findMany({
        where: {
          equipeId: data.equipeId,
          dataReferencia: { gte: dataInicio, lte: dataFim },
        },
        include: {
          Itens: {
            include: {
              eletricista: {
                select: { id: true, nome: true, matricula: true },
              },
            },
          },
        },
      });

      // Buscar justificativas de equipe aprovadas que não geram falta
      const justificativasEquipe = await prisma.justificativaEquipe.findMany({
        where: {
          equipeId: data.equipeId,
          dataReferencia: { gte: dataInicio, lte: dataFim },
          status: 'aprovada',
        },
        include: {
          tipoJustificativa: true,
        },
      });

      // Agrupar slots por data
      const slotsPorData = new Map();
      for (const slot of slotsEscala) {
        const dataStr = slot.data.toISOString().split('T')[0];
        if (!slotsPorData.has(dataStr)) {
          slotsPorData.set(dataStr, []);
        }
        slotsPorData.get(dataStr).push(slot);
      }

      // Agrupar turnos por data
      const turnosPorData = new Map();
      for (const turno of turnosAbertos) {
        const dataStr = turno.dataReferencia.toISOString().split('T')[0];
        if (!turnosPorData.has(dataStr)) {
          turnosPorData.set(dataStr, []);
        }
        turnosPorData.get(dataStr).push(turno);
      }

      // Agrupar justificativas por data
      const justificativasPorData = new Map();
      for (const just of justificativasEquipe) {
        const dataStr = just.dataReferencia.toISOString().split('T')[0];
        justificativasPorData.set(dataStr, just);
      }

      // Calcular métricas
      let diasEscalados = 0;
      let diasAbertos = 0;
      let diasJustificadosSemFalta = 0;
      let totalEletricistasPrevistos = 0;
      let totalEletricistasQueTrabalharam = 0;

      const detalhamento = [];

      // Processar cada dia do período
      const dataAtual = new Date(dataInicio);
      while (dataAtual <= dataFim) {
        const dataStr = dataAtual.toISOString().split('T')[0];
        const slotsDoDia = slotsPorData.get(dataStr) || [];
        const turnosDoDia = turnosPorData.get(dataStr) || [];
        const justificativaDoDia = justificativasPorData.get(dataStr);

        if (slotsDoDia.length > 0) {
          diasEscalados++;
          totalEletricistasPrevistos += slotsDoDia.length;

          const eletricistasEscalados = new Set(
            slotsDoDia.map((s: any) => s.eletricistaId)
          );
          const eletricistasQueTrabalharam = new Set(
            turnosDoDia.flatMap((t: any) => t.Itens.map((i: any) => i.eletricistaId))
          );

          // Se há justificativa aprovada que não gera falta, contar como trabalhado
          if (
            justificativaDoDia &&
            !justificativaDoDia.tipoJustificativa.geraFalta
          ) {
            diasJustificadosSemFalta++;
            totalEletricistasQueTrabalharam += eletricistasEscalados.size;
          } else {
            totalEletricistasQueTrabalharam += eletricistasQueTrabalharam.size;
          }

          const turnoAberto = turnosDoDia.length > 0;
          if (turnoAberto) {
            diasAbertos++;
          }

          const aderencia =
            eletricistasEscalados.size > 0
              ? (eletricistasQueTrabalharam.size / eletricistasEscalados.size) *
                100
              : 0;

          detalhamento.push({
            data: new Date(dataAtual),
            eletricistasEscalados: eletricistasEscalados.size,
            eletricistasQueTrabalharam: eletricistasQueTrabalharam.size,
            turnoAberto,
            justificativa: justificativaDoDia
              ? {
                  tipo: justificativaDoDia.tipoJustificativa.nome,
                  geraFalta: justificativaDoDia.tipoJustificativa.geraFalta,
                }
              : undefined,
            aderencia: Math.round(aderencia * 100) / 100,
          });
        }

        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      // Calcular percentuais
      const aderenciaDias =
        diasEscalados > 0 ? (diasAbertos / diasEscalados) * 100 : 0;
      const aderenciaEletricistas =
        totalEletricistasPrevistos > 0
          ? (totalEletricistasQueTrabalharam / totalEletricistasPrevistos) *
            100
          : 0;

      return {
        resumo: {
          diasEscalados,
          diasAbertos,
          diasJustificadosSemFalta,
          aderenciaDias: Math.round(aderenciaDias * 100) / 100,
          totalEletricistasPrevistos,
          totalEletricistasQueTrabalharam,
          aderenciaEletricistas: Math.round(aderenciaEletricistas * 100) / 100,
        },
        detalhamento,
      };
    },
    rawData,
    { entityName: 'AderenciaEquipe', actionType: 'get' }
  );

