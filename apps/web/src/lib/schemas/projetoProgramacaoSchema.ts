import { z } from 'zod';
import { ProjStatusProjeto } from '@nexa-oper/db';
import type { IncludeConfig } from '../types/common';

const optionalTextSchema = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .or(z.literal(''))
  .transform((value) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const projetoProgramacaoCreateSchema = z.object({
  contratoId: z.number().int().positive(),
  numeroProjeto: z.string().trim().min(1).max(100),
  municipio: z.string().trim().min(1).max(255),
  equipamento: z.string().trim().min(1).max(255),
  observacao: optionalTextSchema,
});

export const projetoProgramacaoUpdateSchema =
  projetoProgramacaoCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const projetoProgramacaoFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  status: z.nativeEnum(ProjStatusProjeto).optional(),
  include: z.custom<IncludeConfig>().optional(),
});
