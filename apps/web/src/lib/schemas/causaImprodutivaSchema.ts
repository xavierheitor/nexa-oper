import { z } from 'zod';

export const causaImprodutivaCreateSchema = z.object({
  causa: z.string().trim().min(1).max(255),
  ativo: z.boolean().optional(),
});

export const causaImprodutivaUpdateSchema = causaImprodutivaCreateSchema.extend({
  id: z.number().int().positive(),
});

export const causaImprodutivaFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
});
