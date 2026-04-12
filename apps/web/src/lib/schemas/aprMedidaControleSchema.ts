import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const aprMedidaControleCreateSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
});

export const aprMedidaControleUpdateSchema =
  aprMedidaControleCreateSchema.extend({
    id: z.number().int().positive('ID deve ser um número positivo'),
  });

export const aprMedidaControleFilterSchema = z.object({
  page: z.number().int().positive('Página deve ser um número positivo'),
  pageSize: z
    .number()
    .int()
    .positive('Tamanho da página deve ser um número positivo'),
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

export type AprMedidaControleCreate = z.infer<
  typeof aprMedidaControleCreateSchema
>;
export type AprMedidaControleUpdate = z.infer<
  typeof aprMedidaControleUpdateSchema
>;
export type AprMedidaControleFilter = z.infer<
  typeof aprMedidaControleFilterSchema
>;
