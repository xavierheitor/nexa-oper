/**
 * Server Action para listar faltas com filtros
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { faltaListResponseSchema, faltaFilterSchema } from '../../schemas/turnoRealizadoSchema';

/**
 * Lista faltas com filtros e paginação
 */
export const listFaltas = async (rawData: unknown) =>
  handleServerAction(
    faltaFilterSchema,
    async (data, session) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      const params = new URLSearchParams();
      if (data.eletricistaId) params.append('eletricistaId', String(data.eletricistaId));
      if (data.equipeId) params.append('equipeId', String(data.equipeId));
      if (data.dataInicio)
        params.append('dataInicio', data.dataInicio instanceof Date ? data.dataInicio.toISOString() : String(data.dataInicio));
      if (data.dataFim)
        params.append('dataFim', data.dataFim instanceof Date ? data.dataFim.toISOString() : String(data.dataFim));
      if (data.status) params.append('status', data.status);
      if (data.page) params.append('page', String(data.page));
      if (data.pageSize) params.append('pageSize', String(data.pageSize));

      const response = await fetch(
        `${baseUrl}/api/turnos-realizados/faltas?${params.toString()}`,
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
        throw new Error(`Erro ao buscar faltas: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      return faltaListResponseSchema.parse(result);
    },
    rawData,
    { entityName: 'Falta', actionType: 'list' }
  );

