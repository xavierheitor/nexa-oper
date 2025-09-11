/**
 * Schema de Eletricista
 *
 * Este schema define as validações para o modelo de Eletricista.
 *
 * @author [Heitor Xavier]
 * @date [11/09/2025]
 * @version [Versão]
 * @copyright [Copyright 2025]
 * @license [MIT]
 * @description [Schema de Eletricista]
 */

import { z } from 'zod';

export const eletricistaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome deve ter no máximo 255 caracteres'),
  matricula: z.string().min(1, 'Matrícula é obrigatória').max(255, 'Matrícula deve ter no máximo 255 caracteres'),
  telefone: z.string().min(1, 'Telefone é obrigatório').max(255, 'Telefone deve ter no máximo 255 caracteres'),
  estado: z.string().min(1, 'Estado é obrigatório').max(2, 'Estado deve ter no máximo 2 caracteres'),
  contratoId: z.number().int('Contrato é obrigatório'),
});

export const eletricistaUpdateSchema = eletricistaCreateSchema.extend({
  id: z.number().int('ID é obrigatório'),
});

export const eletricistaFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  include: z.any().optional(),
  contratoId: z.number().int('Contrato é obrigatório').optional(),
});

export type EletricistaCreate = z.infer<typeof eletricistaCreateSchema>;
export type EletricistaUpdate = z.infer<typeof eletricistaUpdateSchema>;
export type EletricistaFilter = z.infer<typeof eletricistaFilterSchema>;