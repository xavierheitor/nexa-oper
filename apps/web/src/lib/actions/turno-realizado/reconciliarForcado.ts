/**
 * Server Action para executar reconciliação forçada de turnos
 *
 * Reconcilia forçadamente todos os dias/equipes em um período,
 * ignorando a margem de 30 minutos
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { reconciliarDiaEquipeInterna } from '../turno/reconciliarDiaEquipe';
import { prisma } from '@/lib/db/db.service';

const reconciliarForcadoSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional(),
  diasHistorico: z.number().int().positive().optional(),
});

/**
 * Executa reconciliação forçada de turnos
 *
 * @param rawData - Dados brutos do formulário
 * @returns Resultado da reconciliação
 */
export const reconciliarForcado = async (rawData: unknown) =>
  handleServerAction(
    reconciliarForcadoSchema,
    async (data) => {
      const agora = new Date();

      // Calcular período
      let dataInicio: Date;
      let dataFim: Date;

      if (data.dataInicio && data.dataFim) {
        dataInicio = new Date(data.dataInicio);
        dataFim = new Date(data.dataFim);
      } else {
        const diasHistorico = data.diasHistorico || 30;
        dataFim = new Date(agora);
        dataFim.setHours(23, 59, 59, 999);
        dataInicio = new Date(agora);
        dataInicio.setDate(dataInicio.getDate() - diasHistorico);
        dataInicio.setHours(0, 0, 0, 0);
      }

      dataInicio.setHours(0, 0, 0, 0);
      dataFim.setHours(23, 59, 59, 999);

      // Buscar todas as equipes que têm escala publicada no período
      const equipesComEscala = await prisma.escalaEquipePeriodo.findMany({
        where: {
          status: 'PUBLICADA',
          periodoInicio: { lte: dataFim },
          periodoFim: { gte: dataInicio },
        },
        select: {
          equipeId: true,
        },
        distinct: ['equipeId'],
      });

      const equipesIds = equipesComEscala.map((e) => e.equipeId);

      if (equipesIds.length === 0) {
        return {
          success: false,
          message: 'Nenhuma equipe com escala publicada encontrada no período especificado',
          periodo: {
            dataInicio: dataInicio.toISOString().split('T')[0],
            dataFim: dataFim.toISOString().split('T')[0],
          },
          equipesProcessadas: 0,
          diasProcessados: 0,
          resultados: [],
        };
      }

      // Coletar todos os dias/equipes que precisam ser reconciliados
      const pendentes: Array<{ equipeId: number; data: string }> = [];

      for (const equipeId of equipesIds) {
        const dataAtual = new Date(dataInicio);
        while (dataAtual <= dataFim) {
          const dataStr = dataAtual.toISOString().split('T')[0];
          const dataRefInicio = new Date(dataAtual);
          dataRefInicio.setHours(0, 0, 0, 0);
          const dataRefFim = new Date(dataAtual);
          dataRefFim.setHours(23, 59, 59, 999);

          // Verificar se há slots de escala neste dia para esta equipe
          const slotsNoDia = await prisma.slotEscala.findFirst({
            where: {
              data: {
                gte: dataRefInicio,
                lte: dataRefFim,
              },
              escalaEquipePeriodo: {
                equipeId,
                status: 'PUBLICADA',
              },
            },
            select: { id: true },
          });

          if (slotsNoDia) {
            pendentes.push({ equipeId, data: dataStr });
          }

          // Avançar para próximo dia
          dataAtual.setDate(dataAtual.getDate() + 1);
        }
      }

      // Executar reconciliação forçada para cada dia/equipe pendente
      const resultados: Array<{
        equipeId: number;
        data: string;
        success: boolean;
        message?: string;
        error?: string;
      }> = [];

      for (const pendente of pendentes) {
        try {
          await reconciliarDiaEquipeInterna({
            dataReferencia: pendente.data,
            equipePrevistaId: pendente.equipeId,
            executadoPor: 'forced-reconciliation',
          });

          resultados.push({
            equipeId: pendente.equipeId,
            data: pendente.data,
            success: true,
            message: 'Reconciliação executada com sucesso',
          });
        } catch (error: any) {
          resultados.push({
            equipeId: pendente.equipeId,
            data: pendente.data,
            success: false,
            error: error.message || 'Erro desconhecido',
          });
        }
      }

      const sucessos = resultados.filter((r) => r.success).length;
      const erros = resultados.filter((r) => !r.success).length;

      return {
        success: erros === 0,
        message: `Reconciliação forçada executada: ${sucessos} sucesso(s), ${erros} erro(s)`,
        periodo: {
          dataInicio: dataInicio.toISOString().split('T')[0],
          dataFim: dataFim.toISOString().split('T')[0],
        },
        equipesProcessadas: equipesIds.length,
        diasProcessados: pendentes.length,
        sucessos,
        erros,
        resultados,
      };
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'create' }
  );

