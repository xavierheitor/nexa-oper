import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const atividadeFormPerguntaCreateSchema = z.object({
  contratoId: z.number().int().positive(),
  perguntaChave: z.string().min(1).max(120),
  ordem: z.number().int().min(0).optional(),
  titulo: z.string().min(1).max(255),
  hintResposta: z.string().max(255).optional(),
  tipoResposta: z.string().min(1).max(50).optional(),
  obrigaFoto: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

export const atividadeFormPerguntaUpdateSchema =
  atividadeFormPerguntaCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const atividadeFormPerguntaFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  obrigaFoto: z.boolean().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
