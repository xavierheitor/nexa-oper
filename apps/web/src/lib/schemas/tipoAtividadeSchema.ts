import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const tipoAtividadeCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  contratoId: z.number().int().positive(),
});

export const tipoAtividadeUpdateSchema = tipoAtividadeCreateSchema.extend({
  id: z.number().int(),
});

export const tipoAtividadeFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
