import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const tipoAtividadeServicoCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  atividadeTipoId: z.number().int().positive(),
});

export const tipoAtividadeServicoUpdateSchema =
  tipoAtividadeServicoCreateSchema.extend({
    id: z.number().int(),
  });

export const tipoAtividadeServicoFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  atividadeTipoId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
