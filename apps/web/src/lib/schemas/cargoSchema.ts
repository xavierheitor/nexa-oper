/**
 * Schema de Cargo
 *
 * Define validações para o modelo de Cargo (função/posição do eletricista)
 */

import { z } from 'zod';

export const cargoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  salarioBase: z.coerce.number().min(0, 'Salário base deve ser positivo').default(0),
});

export const cargoUpdateSchema = cargoCreateSchema.extend({
  id: z.number().int().positive(),
});

export const cargoFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10),
  orderBy: z.string().default('nome'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  include: z.any().optional(),
});

export type CargoCreate = z.infer<typeof cargoCreateSchema>;
export type CargoUpdate = z.infer<typeof cargoUpdateSchema>;
export type CargoFilter = z.infer<typeof cargoFilterSchema>;

