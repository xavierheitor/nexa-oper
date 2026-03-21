import { ProjTipoConsumoMaterial } from '@nexa-oper/db';
import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const projTipoEstruturaMaterialItemSchema = z.object({
  materialId: z.number().int().positive(),
  quantidadeBase: z.number().positive(),
  tipoConsumo: z.nativeEnum(ProjTipoConsumoMaterial),
});

export const projTipoEstruturaMaterialCreateSchema = z.object({
  tipoEstruturaId: z.number().int().positive(),
  materialId: z.number().int().positive(),
  quantidadeBase: z.number().positive(),
  tipoConsumo: z.nativeEnum(ProjTipoConsumoMaterial),
});

export const projTipoEstruturaMaterialCreateBatchSchema = z.object({
  tipoEstruturaId: z.number().int().positive(),
  itens: z.array(projTipoEstruturaMaterialItemSchema).min(1),
});

export const projTipoEstruturaMaterialUpdateSchema =
  projTipoEstruturaMaterialCreateSchema.extend({
    id: z.number().int(),
  });

export const projTipoEstruturaMaterialFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  tipoEstruturaId: z.number().int().positive().optional(),
  materialId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});
