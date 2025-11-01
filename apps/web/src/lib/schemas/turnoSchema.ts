/**
 * Schemas para Turno
 *
 * Define todas as validações e tipos para operações CRUD de turnos,
 * incluindo filtros, criação, atualização e listagem.
 */

import { z } from 'zod';

/**
 * Schema para filtros de turno
 */
export const turnoFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(2000).default(10),
  orderBy: z.string().default('dataInicio'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  veiculoId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  eletricistaId: z.number().int().positive().optional(),
  status: z.enum(['ABERTO', 'FECHADO', 'CANCELADO']).optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  include: z.any().optional(),
});

/**
 * Schema para criação de turno
 */
export const turnoCreateSchema = z.object({
  dataSolicitacao: z.coerce.date(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date().optional(),
  veiculoId: z.number().int().positive(),
  equipeId: z.number().int().positive(),
  dispositivo: z.string().min(1),
  kmInicio: z.number().int().positive(),
  kmFim: z.number().int().positive().optional(),
  eletricistaIds: z.array(z.number().int().positive()).optional(),
});

/**
 * Schema para atualização de turno
 */
export const turnoUpdateSchema = turnoCreateSchema.partial().extend({
  id: z.number().int().positive(),
  eletricistaIds: z.array(z.number().int().positive()).optional(),
});

// Exports de tipos inferidos
export type TurnoFilter = z.infer<typeof turnoFilterSchema>;
export type TurnoCreate = z.infer<typeof turnoCreateSchema>;
export type TurnoUpdate = z.infer<typeof turnoUpdateSchema>;
