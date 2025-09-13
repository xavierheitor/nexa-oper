import { z } from 'zod';

export const checklistCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  tipoChecklistId: z.number().int(),
  perguntaIds: z.array(z.number().int()).optional().default([]),
  opcaoRespostaIds: z.array(z.number().int()).optional().default([]),
});

export const checklistUpdateSchema = checklistCreateSchema.extend({
  id: z.number().int(),
});

export const checklistFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});

