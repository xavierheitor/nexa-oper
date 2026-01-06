import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const checklistOpcaoRespostaCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  geraPendencia: z.boolean().optional().default(false),
});

export const checklistOpcaoRespostaUpdateSchema = checklistOpcaoRespostaCreateSchema.extend({
  id: z.number().int(),
});

export const checklistOpcaoRespostaFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

