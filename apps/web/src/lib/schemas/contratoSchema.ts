// src/lib/schemas/contratoSchema.ts
import { z } from 'zod';

export const contratoCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  numero: z.string().min(1).max(255),
  dataInicio: z.coerce.date().nullable().optional(),
  dataFim: z.coerce.date().nullable().optional(),
});

export const contratoUpdateSchema = contratoCreateSchema.extend({
  id: z.number().int().positive(),
});

export const contratoFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  include: z.any().optional(),
});
