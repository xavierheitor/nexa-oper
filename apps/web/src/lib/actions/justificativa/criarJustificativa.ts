/**
 * Server Action para criar justificativa de falta
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const criarJustificativaSchema = z.object({
  faltaId: z.number().int().positive(),
  tipoId: z.number().int().positive(),
  descricao: z.string().optional(),
});

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

/**
 * Cria uma justificativa para uma falta
 */
export const criarJustificativa = async (rawData: unknown) =>
  handleServerAction(
    criarJustificativaSchema,
    async (data, session) => {
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      const response = await fetch(`${baseUrl}/api/faltas/${data.faltaId}/justificativas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tipoId: data.tipoId,
          descricao: data.descricao,
          createdBy: session.user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao criar justificativa: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    },
    rawData,
    { entityName: 'Justificativa', actionType: 'create' }
  );

