import { ProjStatusProjeto } from '@nexa-oper/db';
import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const projProjetoCreateSchema = z.object({
  programaId: z.number().int().positive(),
  numeroProjeto: z.string().trim().min(1).max(255),
  descricao: z.string().trim().min(1).max(5000),
  equipamento: z.string().trim().min(1).max(255),
  municipio: z.string().trim().min(1).max(255),
  status: z
    .nativeEnum(ProjStatusProjeto)
    .default(ProjStatusProjeto.PENDENTE),
});

export const projProjetoUpdateSchema = projProjetoCreateSchema.extend({
  id: z.number().int().positive(),
});

export const projProjetoFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  programaId: z.number().int().positive().optional(),
  status: z.nativeEnum(ProjStatusProjeto).optional(),
  include: z.custom<IncludeConfig>().optional(),
});
