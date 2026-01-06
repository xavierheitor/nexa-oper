import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const tipoChecklistCreateSchema = z.object({
  nome: z.string().min(1).max(255),
});

export const tipoChecklistUpdateSchema = tipoChecklistCreateSchema.extend({
  id: z.number().int(),
});

export const tipoChecklistFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

