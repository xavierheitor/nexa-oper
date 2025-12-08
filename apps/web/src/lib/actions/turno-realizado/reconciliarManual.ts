/**
 * Server Action para executar reconciliação manual de turnos
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const reconciliarManualSchema = z.object({
  dataReferencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  equipeId: z.number().int().positive().optional(),
  todasEquipes: z.boolean(),
});

/**
 * Executa reconciliação manual de turnos
 *
 * Esta Server Action faz a requisição para a API do servidor Next.js,
 * que é visto como localhost pela API, permitindo que o LocalhostCorsGuard
 * permita o acesso mesmo em produção.
 *
 * @param rawData - Dados brutos do formulário
 * @returns Resultado da reconciliação da API
 */
export const reconciliarManual = async (rawData: unknown) =>
  handleServerAction(
    reconciliarManualSchema,
    async (data, session) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      // Validar que se não for todasEquipes, equipeId deve estar presente
      if (!data.todasEquipes && !data.equipeId) {
        throw new Error('equipeId é obrigatório quando todasEquipes não é true');
      }

      const body: any = {
        dataReferencia: data.dataReferencia,
        todasEquipes: data.todasEquipes,
      };

      if (!data.todasEquipes && data.equipeId) {
        body.equipeId = data.equipeId;
      }

      // Fazer requisição do servidor (vem de localhost, então passa no LocalhostCorsGuard)
      const response = await fetch(`${baseUrl}/api/turnos-realizados/reconciliacao/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      // Retornar exatamente o mesmo formato que a API retorna
      return responseData;
    },
    rawData,
    { entityName: 'TurnoRealizado', actionType: 'create' }
  );

