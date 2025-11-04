/**
 * Server Action para obter dados consolidados de frequência de uma equipe
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { consolidadoEquipeResponseSchema } from '../../schemas/turnoRealizadoSchema';
import { z } from 'zod';

const getConsolidadoEquipeSchema = z.object({
  equipeId: z.number().int().positive(),
  dataInicio: z.string(),
  dataFim: z.string(),
});

/**
 * Obtém dados consolidados de frequência de uma equipe
 */
export const getConsolidadoEquipe = async (rawData: unknown) =>
  handleServerAction(
    getConsolidadoEquipeSchema,
    async (data, session) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      const params = new URLSearchParams();
      params.append('dataInicio', data.dataInicio);
      params.append('dataFim', data.dataFim);

      const response = await fetch(
        `${baseUrl}/api/turnos-realizados/consolidado/equipe/${data.equipeId}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar consolidado: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      return consolidadoEquipeResponseSchema.parse(result);
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'get' }
  );

