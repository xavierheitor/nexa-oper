/**
 * Server Action para buscar localizações de um turno
 *
 * Retorna todas as localizações registradas para um turno específico,
 * ordenadas cronologicamente (da primeira à última).
 */

'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { prisma } from '../../db/db.service';

/**
 * Schema de validação para buscar localizações
 */
const getLocalizacoesSchema = z.object({
  turnoId: z.number().int().positive(),
});

/**
 * Busca localizações de um turno
 *
 * @param rawData - Dados com turnoId
 * @returns Lista de localizações ordenadas por data de captura
 */
export const getLocalizacoesTurno = async (rawData: unknown) =>
  handleServerAction(
    getLocalizacoesSchema,
    async (data) => {
      const localizacoes = await prisma.mobileLocation.findMany({
        where: {
          turnoId: data.turnoId,
          deletedAt: null, // Apenas localizações não deletadas
        },
        orderBy: {
          capturedAt: 'asc', // Ordem cronológica (primeira à última)
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          accuracy: true,
          capturedAt: true,
          tagType: true,
          tagDetail: true,
          batteryLevel: true,
        },
      });

      return {
        localizacoes,
        total: localizacoes.length,
      };
    },
    rawData,
    { entityName: 'MobileLocation', actionType: 'get' }
  );
