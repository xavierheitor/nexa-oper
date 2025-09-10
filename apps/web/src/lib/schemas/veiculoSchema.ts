import { z } from 'zod';

export const veiculoCreateSchema = z.object({
  placa: z.string().min(1).max(255),
  modelo: z.string().min(1).max(255),
  ano: z.number().int(),
  tipoVeiculoId: z.number().int(),
  contratoId: z.number().int(),
});

export const veiculoUpdateSchema = veiculoCreateSchema.extend({
  id: z.number().int(),
});

export const veiculoFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.any().optional(),
});