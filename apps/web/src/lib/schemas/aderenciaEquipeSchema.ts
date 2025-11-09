/**
 * Schema Zod para Relatório de Aderência de Equipe
 */

import { z } from 'zod';

/**
 * Schema para buscar aderência de equipe
 */
export const getAderenciaEquipeSchema = z.object({
  equipeId: z.number().int().positive({ message: 'ID da equipe é obrigatório' }),
  dataInicio: z.string().datetime({ message: 'Data de início inválida' }),
  dataFim: z.string().datetime({ message: 'Data de fim inválida' }),
});

export type GetAderenciaEquipeInput = z.infer<typeof getAderenciaEquipeSchema>;

