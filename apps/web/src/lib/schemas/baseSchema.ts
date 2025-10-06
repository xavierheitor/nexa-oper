import { z } from 'zod';

export const baseCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  contratoId: z.number().int().positive(),
});

export const baseUpdateSchema = baseCreateSchema.extend({
  id: z.number().int(),
});

export const baseFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  include: z.any().optional(),
});
