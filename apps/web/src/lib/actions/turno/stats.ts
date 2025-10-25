/**
 * Server Action para Estatísticas de Turnos
 *
 * Esta action recupera estatísticas sobre turnos abertos,
 * incluindo total de turnos abertos e por base.
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

/**
 * Schema vazio para estatísticas (não requer parâmetros)
 */
const turnoStatsSchema = z.object({});

/**
 * Busca estatísticas de turnos abertos
 *
 * @returns Estatísticas de turnos
 */
export const getTurnoStats = async () =>
  handleServerAction(
    turnoStatsSchema,
    async (data, session) => {
      // Fazer requisição à API
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Buscar turnos abertos
      const response = await fetch(`${baseUrl}/api/turnos?status=ABERTO&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
          Cookie: session.accessToken ? `access_token=${session.accessToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar estatísticas: ${response.statusText}`);
      }

      const turnos = await response.json();

      // Processar estatísticas
      const totalTurnosAbertos = turnos.data?.length || 0;

      // Agrupar por base (vamos buscar a base através do veículo)
      const turnosPorBase: Record<number, number> = {};

      for (const turno of turnos.data || []) {
        // Buscar base do veículo
        const veiculoResponse = await fetch(`${baseUrl}/api/veiculos/${turno.veiculoId}`, {
          headers: {
            'Content-Type': 'application/json',
            Cookie: session.accessToken ? `access_token=${session.accessToken}` : '',
          },
        });

        if (veiculoResponse.ok) {
          const veiculo = await veiculoResponse.json();
          const baseId = veiculo.baseId || 0;
          turnosPorBase[baseId] = (turnosPorBase[baseId] || 0) + 1;
        }
      }

      return {
        totalTurnosAbertos,
        turnosPorBase,
        turnos,
      };
    },
    {},
    { entityName: 'Turno', actionType: 'get' }
  );
