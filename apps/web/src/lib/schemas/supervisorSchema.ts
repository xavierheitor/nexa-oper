import { z } from 'zod';

export const supervisorCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  contratoId: z.number().int(),
});

export const supervisorUpdateSchema = supervisorCreateSchema.extend({
  id: z.number().int(),
});

export const supervisorFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});

