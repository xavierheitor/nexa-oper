/**
 * Server Action para aprovar ou rejeitar uma hora extra
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import {
  aprovarHoraExtraResponseSchema,
  aprovarHoraExtraSchema,
} from '../../schemas/turnoRealizadoSchema';
import { z } from 'zod';

const aprovarHoraExtraRequestSchema = aprovarHoraExtraSchema.extend({
  id: z.number().int().positive(),
});

/**
 * Aprova ou rejeita uma hora extra
 */
export const aprovarHoraExtra = async (rawData: unknown) =>
  handleServerAction(
    aprovarHoraExtraRequestSchema,
    async (data, session) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      const response = await fetch(
        `${baseUrl}/api/turnos-realizados/horas-extras/${data.id}/aprovacao`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            acao: data.acao,
            observacoes: data.observacoes,
            executadoPor: session.user.id,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao aprovar hora extra: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      return aprovarHoraExtraResponseSchema.parse(result);
    },
    rawData,
    { entityName: 'HoraExtra', actionType: 'update' }
  );

