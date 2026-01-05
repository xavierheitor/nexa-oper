/**
 * Server Action para executar reconciliação manual de turnos
 *
 * Esta action executa a reconciliação usando as server actions do web,
 * sem precisar chamar a API externa.
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { reconciliarDiaEquipeInterna } from '../turno/reconciliarDiaEquipe';
import { prisma } from '@/lib/db/db.service';

const reconciliarManualSchema = z.object({
  dataReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  equipeId: z.number().int().positive().optional(),
  todasEquipes: z.boolean(),
});

/**
 * Executa reconciliação manual de turnos
 *
 * @param rawData - Dados brutos do formulário
 * @returns Resultado da reconciliação
 */
export const reconciliarManual = async (rawData: unknown) =>
  handleServerAction(
    reconciliarManualSchema,
    async (data) => {
      // Validar que se não for todasEquipes, equipeId deve estar presente
      if (!data.todasEquipes && !data.equipeId) {
        throw new Error('equipeId é obrigatório quando todasEquipes não é true');
      }

      const dataRef = new Date(data.dataReferencia);
      const dataRefInicio = new Date(dataRef);
      dataRefInicio.setHours(0, 0, 0, 0);
      const dataRefFim = new Date(dataRef);
      dataRefFim.setHours(23, 59, 59, 999);

      let equipesIds: number[] = [];

      if (data.todasEquipes) {
        // Buscar todas as equipes que têm escala publicada na data especificada
        const escalasPublicadas = await prisma.escalaEquipePeriodo.findMany({
          where: {
            status: 'PUBLICADA',
            periodoInicio: { lte: dataRefFim },
            periodoFim: { gte: dataRefInicio },
          },
          select: {
            equipeId: true,
          },
          distinct: ['equipeId'],
        });

        equipesIds = escalasPublicadas.map((e) => e.equipeId);

        if (equipesIds.length === 0) {
          return {
            success: false,
            message: 'Nenhuma equipe com escala publicada encontrada para a data especificada',
            dataReferencia: data.dataReferencia,
            equipesProcessadas: 0,
            resultados: [],
          };
        }
      } else {
        if (!data.equipeId) {
          throw new Error('equipeId é obrigatório quando todasEquipes não é true');
        }
        equipesIds = [data.equipeId];
      }

      // Executar reconciliação para cada equipe
      const resultados: Array<{
        equipeId: number;
        success: boolean;
        message?: string;
        error?: string;
      }> = [];

      for (const equipeId of equipesIds) {
        try {
          await reconciliarDiaEquipeInterna({
            dataReferencia: data.dataReferencia,
            equipePrevistaId: equipeId,
            executadoPor: 'manual-reconciliation',
          });

          resultados.push({
            equipeId,
            success: true,
            message: 'Reconciliação executada com sucesso',
          });
        } catch (error: any) {
          resultados.push({
            equipeId,
            success: false,
            error: error.message || 'Erro desconhecido',
          });
        }
      }

      const sucessos = resultados.filter((r) => r.success).length;
      const erros = resultados.filter((r) => !r.success).length;

      return {
        success: erros === 0,
        message: data.todasEquipes
          ? `Reconciliação executada para ${sucessos} equipe(s). ${erros > 0 ? `${erros} erro(s).` : ''}`
          : `Reconciliação executada para equipe ${data.equipeId} em ${data.dataReferencia}`,
        dataReferencia: data.dataReferencia,
        equipesProcessadas: equipesIds.length,
        sucessos,
        erros,
        resultados,
      };
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'create' }
  );

