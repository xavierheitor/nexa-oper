/**
 * Server Action para atualizar snapshot de aderência após abertura de turno
 *
 * Esta action atualiza um snapshot existente quando um turno é aberto
 * após o snapshot parcial do meio-dia, marcando como não aderente se
 * estiver fora da janela de 30 minutos.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import {
  parseTimeToDate,
  calculateMinutesDifference,
  isAderente,
} from '@/lib/utils/turnoPrevistoHelpers';

const atualizarSnapshotSchema = z.object({
  equipeId: z.number(),
  dataReferencia: z.coerce.date(),
  turnoId: z.number(),
  dataAbertura: z.coerce.date(),
});

/**
 * Atualiza snapshot existente quando turno é aberto após snapshot parcial
 *
 * @param rawData - Dados do turno aberto
 * @returns Resultado da atualização
 */
export const atualizarSnapshotAposAbertura = async (rawData: unknown) =>
  handleServerAction(
    atualizarSnapshotSchema,
    async (data) => {
      // Normalizar data de referência
      const dataRef = new Date(data.dataReferencia);
      dataRef.setHours(0, 0, 0, 0);

      // Buscar snapshot existente
      const snapshot = await prisma.aderenciaEscalaSnapshot.findUnique({
        where: {
          equipeId_dataReferencia: {
            equipeId: data.equipeId,
            dataReferencia: dataRef,
          },
        },
      });

      if (!snapshot) {
        // Se não existe snapshot, não faz nada (pode ser turno extra ou antes do snapshot)
        return {
          atualizado: false,
          motivo: 'Snapshot não encontrado',
        };
      }

      // Se já tinha turno aberto antes, não atualizar (snapshot final já foi gerado)
      if (snapshot.turnoId) {
        return {
          atualizado: false,
          motivo: 'Snapshot já possui turno',
        };
      }

      // Calcular aderência
      let status: 'ADERENTE' | 'NAO_ADERENTE' = 'NAO_ADERENTE';
      let diferencaMinutos: number | null = null;

      if (snapshot.horarioPrevisto) {
        const horarioPrevistoDate = parseTimeToDate(
          snapshot.horarioPrevisto,
          dataRef
        );

        diferencaMinutos = calculateMinutesDifference(
          data.dataAbertura,
          horarioPrevistoDate
        );

        if (isAderente(data.dataAbertura, horarioPrevistoDate)) {
          status = 'ADERENTE';
        }
      }

      // Atualizar snapshot
      await prisma.aderenciaEscalaSnapshot.update({
        where: { id: snapshot.id },
        data: {
          status,
          turnoId: data.turnoId,
          dataAbertura: data.dataAbertura,
          diferencaMinutos,
          updatedAt: new Date(),
          updatedBy: 'sistema',
        },
      });

      return {
        atualizado: true,
        status,
        diferencaMinutos,
      };
    },
    rawData,
    { entityName: 'AderenciaEscalaSnapshot', actionType: 'update' }
  );

