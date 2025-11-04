/**
 * Server Action para listar tipos de justificativa
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');

/**
 * Lista todos os tipos de justificativa disponíveis
 */
export const listTiposJustificativa = async () =>
  handleServerAction(
    z.any(),
    async () => {
      if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_URL não está configurada');
      }

      const response = await fetch(`${baseUrl}/api/tipos-justificativa`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar tipos de justificativa: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    },
    {},
    { entityName: 'TipoJustificativa', actionType: 'list' }
  );

