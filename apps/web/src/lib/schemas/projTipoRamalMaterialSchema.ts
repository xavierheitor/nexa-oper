import { ProjTipoConsumoMaterial } from '@nexa-oper/db';
import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const projTipoRamalMaterialCreateSchema = z.object({
  contratoId: z.number().int().positive(),
  tipoRamalId: z.number().int().positive(),
  materialId: z.number().int().positive(),
  quantidadeBase: z.number().positive(),
  tipoConsumo: z.nativeEnum(ProjTipoConsumoMaterial),
});

export const projTipoRamalMaterialUpdateSchema =
  projTipoRamalMaterialCreateSchema.extend({
    id: z.number().int(),
  });

export const projTipoRamalMaterialFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  tipoRamalId: z.number().int().positive().optional(),
  materialId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
