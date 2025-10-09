import { z } from 'zod';

export const baseCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  contratoId: z.number().int().positive(),
});

export const baseUpdateSchema = baseCreateSchema.extend({
  id: z.number().int(),
});

export const baseFilterSchema = z.object({
  page: z.number().int().default(1),
  pageSize: z.number().int().default(10),
  orderBy: z.string().default('nome'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  include: z.any().optional(),
});
