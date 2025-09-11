import { z } from 'zod';

export const equipeCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  tipoEquipeId: z.number().int(),
  contratoId: z.number().int(),
});

export const equipeUpdateSchema = equipeCreateSchema.extend({
  id: z.number().int(),
});

export const equipeFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});

