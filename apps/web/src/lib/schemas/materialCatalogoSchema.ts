import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const materialCatalogoCreateSchema = z.object({
  codigo: z.string().min(1).max(100),
  descricao: z.string().min(1).max(255),
  unidadeMedida: z.string().min(1).max(30),
  contratoId: z.number().int().positive(),
  ativo: z.boolean().optional(),
});

export const materialCatalogoUpdateSchema = materialCatalogoCreateSchema.extend({
  id: z.number().int(),
});

export const materialCatalogoFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  contratoId: z.number().int().positive().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

export const materialCatalogoLoteItemSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').max(100),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255),
  unidadeMedida: z.string().min(1, 'Unidade de medida é obrigatória').max(30),
  ativo: z.boolean().optional(),
});

export const materialCatalogoLoteSchema = z.object({
  contratoId: z.number().int().positive('Contrato é obrigatório'),
  materiais: z
    .array(materialCatalogoLoteItemSchema)
    .min(1, 'Adicione pelo menos um material'),
});

export type MaterialCatalogoLoteInput = z.infer<typeof materialCatalogoLoteSchema>;
export type MaterialCatalogoLoteItem = z.infer<typeof materialCatalogoLoteItemSchema>;
