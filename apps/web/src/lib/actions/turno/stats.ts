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
    async (_data, _session) => {
      // Fazer requisição à API
      // Em produção, NEXT_PUBLIC_API_URL deve estar configurada
      // Em desenvolvimento, usa localhost apenas se a variável não estiver definida
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      // Buscar turnos abertos
      // Nota: Os cookies são enviados automaticamente em server-side fetch
      const response = await fetch(`${baseUrl}/api/turnos?status=ABERTO&limit=1000`, {
        headers: {
          'Content-Type': 'application/json',
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
        // Nota: Os cookies são enviados automaticamente em server-side fetch
        const veiculoResponse = await fetch(`${baseUrl}/api/veiculos/${turno.veiculoId}`, {
          headers: {
            'Content-Type': 'application/json',
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
