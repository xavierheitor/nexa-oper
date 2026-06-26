import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const projProgramaCreateSchema = z.object({
  contratoId: z.number().int().positive(),
  nome: z.string().trim().min(1).max(255),
});

export const projProgramaUpdateSchema = projProgramaCreateSchema.extend({
  id: z.number().int().positive(),
});

export const projProgramaFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
