import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

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
  include: z.custom<IncludeConfig>().optional(),
});

export type BaseCreate = z.infer<typeof baseCreateSchema>;
export type BaseUpdate = z.infer<typeof baseUpdateSchema>;
export type BaseFilter = z.infer<typeof baseFilterSchema>;
