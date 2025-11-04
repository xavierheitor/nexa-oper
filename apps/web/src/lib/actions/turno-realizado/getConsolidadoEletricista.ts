/**
 * Server Action para obter dados consolidados de frequência de um eletricista
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import {
  consolidadoEletricistaResponseSchema,
  periodoSchema,
} from '../../schemas/turnoRealizadoSchema';
import { z } from 'zod';

const getConsolidadoEletricistaSchema = z.object({
  eletricistaId: z.number().int().positive(),
  periodo: periodoSchema.shape.periodo.optional().default('custom'),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

/**
 * Obtém dados consolidados de frequência de um eletricista
 */
export const getConsolidadoEletricista = async (rawData: unknown) =>
  handleServerAction(
    getConsolidadoEletricistaSchema,
    async (data, session) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      // Construir query params
      const params = new URLSearchParams();
      params.append('periodo', data.periodo || 'custom');
      if (data.dataInicio) params.append('dataInicio', data.dataInicio);
      if (data.dataFim) params.append('dataFim', data.dataFim);

      const response = await fetch(
        `${baseUrl}/api/turnos-realizados/consolidado/eletricista/${data.eletricistaId}?${params.toString()}`,
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

      // Validar resposta com schema Zod
      return consolidadoEletricistaResponseSchema.parse(result);
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'get' }
  );

