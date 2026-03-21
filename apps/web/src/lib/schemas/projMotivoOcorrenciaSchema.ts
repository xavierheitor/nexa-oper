import { ProjTipoMotivoOcorrencia } from '@nexa-oper/db';
import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const projMotivoOcorrenciaCreateSchema = z.object({
  codigo: z.string().min(1).max(100),
  descricao: z.string().min(1).max(255),
  tipo: z.nativeEnum(ProjTipoMotivoOcorrencia),
  ativo: z.boolean().optional(),
});

export const projMotivoOcorrenciaUpdateSchema =
  projMotivoOcorrenciaCreateSchema.extend({
    id: z.number().int(),
  });

export const projMotivoOcorrenciaFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  tipo: z.nativeEnum(ProjTipoMotivoOcorrencia).optional(),
  ativo: z.boolean().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
