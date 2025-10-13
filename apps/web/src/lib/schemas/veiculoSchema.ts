import { z } from 'zod';

export const veiculoCreateSchema = z.object({
  placa: z.string().min(1).max(255),
  modelo: z.string().min(1).max(255),
  ano: z.number().int(),
  tipoVeiculoId: z.number().int(),
  contratoId: z.number().int(),
  baseId: z.number().int().optional(),
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
  // Filtros server-side para relacionamentos
  contratoId: z.number().int().optional(),
  tipoVeiculoId: z.number().int().optional(),
  baseId: z.number().int().optional(),
});

// Schema para cadastro em lote
export const veiculoLoteItemSchema = z.object({
  placa: z.string().min(1, 'Placa é obrigatória').max(255),
  modelo: z.string().min(1, 'Modelo é obrigatório').max(255),
  ano: z.coerce.number().int().min(1900).max(2100),
});

export const veiculoLoteSchema = z.object({
  contratoId: z.number().int().positive('Contrato é obrigatório'),
  baseId: z.number().int().positive('Base é obrigatória'),
  tipoVeiculoId: z.number().int().positive('Tipo de veículo é obrigatório'),
  veiculos: z.array(veiculoLoteItemSchema).min(1, 'Adicione pelo menos um veículo'),
});

export type VeiculoLoteInput = z.infer<typeof veiculoLoteSchema>;
export type VeiculoLoteItem = z.infer<typeof veiculoLoteItemSchema>;
