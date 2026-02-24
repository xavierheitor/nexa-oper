import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const atividadeFormTemplateCreateSchema = z.object({
  nome: z.string().min(1).max(255),
  descricao: z.string().max(500).optional(),
  contratoId: z.number().int().positive(),
  ativo: z.boolean().optional(),
  tipoServicoIds: z.array(z.number().int().positive()).optional().default([]),
  perguntaIds: z.array(z.number().int().positive()).optional().default([]),
});

export const atividadeFormTemplateUpdateSchema =
  atividadeFormTemplateCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const atividadeFormTemplateFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
