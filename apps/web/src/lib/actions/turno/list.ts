/**
 * Server Action para Listagem de Turnos
 *
 * Esta action recupera uma lista paginada de turnos da API,
 * incluindo filtros por veículo, equipe, eletricista e status.
 */

'use server';

import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

/**
 * Schema para filtros de turnos
 */
const turnoFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  veiculoId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  eletricistaId: z.number().int().positive().optional(),
  status: z.enum(['ABERTO', 'FECHADO', 'CANCELADO']).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

/**
 * Lista turnos com filtros opcionais
 *
 * @param rawData - Dados de filtro e paginação
 * @returns Lista paginada de turnos
 */
export const listTurnos = async (rawData: unknown) =>
  handleServerAction(
    turnoFilterSchema,
    async (data, session) => {
      // Construir query string
      const params = new URLSearchParams();
      params.append('page', String(data.page));
      params.append('limit', String(data.pageSize));

      if (data.search) {
        params.append('search', data.search);
      }
      if (data.veiculoId) {
        params.append('veiculoId', String(data.veiculoId));
      }
      if (data.equipeId) {
        params.append('equipeId', String(data.equipeId));
      }
      if (data.eletricistaId) {
        params.append('eletricistaId', String(data.eletricistaId));
      }
      if (data.status) {
        params.append('status', data.status);
      }
      if (data.dataInicio) {
        params.append('dataInicio', data.dataInicio.toISOString());
      }
      if (data.dataFim) {
        params.append('dataFim', data.dataFim.toISOString());
      }

      // Fazer requisição à API
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/turnos?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Cookie: session.accessToken ? `access_token=${session.accessToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar turnos: ${response.statusText}`);
      }

      return response.json();
    },
    rawData,
    { entityName: 'Turno', actionType: 'list' }
  );
