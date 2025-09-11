import { z } from 'zod';

export const tipoEquipeCreateSchema = z.object({
  nome: z.string().min(1).max(255),
});

export const tipoEquipeUpdateSchema = tipoEquipeCreateSchema.extend({
  id: z.number().int(),
});

export const tipoEquipeFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});

