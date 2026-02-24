import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

export const aprCreateSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  grupoPerguntaIds: z
    .array(z.number().int().positive('ID do grupo deve ser positivo'))
    .optional()
    .default([]),
});

export const aprUpdateSchema = aprCreateSchema.extend({
  id: z.number().int().positive('ID deve ser um número positivo'),
});

export const aprFilterSchema = z.object({
  page: z.number().int().positive('Página deve ser um número positivo'),
  pageSize: z.number().int().positive('Tamanho da página deve ser um número positivo'),
  orderBy: z.string().min(1, 'Campo de ordenação é obrigatório'),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

export type AprCreate = z.infer<typeof aprCreateSchema>;
export type AprUpdate = z.infer<typeof aprUpdateSchema>;
export type AprFilter = z.infer<typeof aprFilterSchema>;
