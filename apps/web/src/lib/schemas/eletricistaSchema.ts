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
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  matricula: z
    .string()
    .min(1, 'Matrícula é obrigatória')
    .max(255, 'Matrícula deve ter no máximo 255 caracteres'),
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .max(255, 'Telefone deve ter no máximo 255 caracteres'),
  estado: z
    .string()
    .min(1, 'Estado é obrigatório')
    .max(2, 'Estado deve ter no máximo 2 caracteres'),
  admissao: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  cargoId: z.number().int('Cargo é obrigatório'),
  contratoId: z.number().int('Contrato é obrigatório'),
  baseId: z.number().int('Base é obrigatória').optional(),
  // Status inicial do eletricista (opcional, padrão ATIVO)
  status: z
    .enum([
      'ATIVO',
      'FERIAS',
      'LICENCA_MEDICA',
      'LICENCA_MATERNIDADE',
      'LICENCA_PATERNIDADE',
      'SUSPENSAO',
      'TREINAMENTO',
      'AFastADO',
      'DESLIGADO',
      'APOSENTADO',
    ])
    .optional()
    .default('ATIVO'),
});

export const eletricistaUpdateSchema = eletricistaCreateSchema.extend({
  id: z.number().int('ID é obrigatório'),
});

export const eletricistaFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(10000).default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  include: z.record(z.unknown()).optional(),
  contratoId: z.number().int('Contrato é obrigatório').optional(),
  equipeId: z.number().int().optional(),
  ativo: z.boolean().optional(),
  // Filtros server-side para relacionamentos
  cargoId: z.number().int().optional(),
  baseId: z.number().int().optional(),
  estado: z.string().optional(),
  // Filtro por status do eletricista
  status: z.enum([
    'ATIVO',
    'FERIAS',
    'LICENCA_MEDICA',
    'LICENCA_MATERNIDADE',
    'LICENCA_PATERNIDADE',
    'SUSPENSAO',
    'TREINAMENTO',
    'AFastADO',
    'DESLIGADO',
    'APOSENTADO',
  ]).optional(),
});

// Schema para cadastro em lote
export const eletricistaLoteItemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  matricula: z.string().min(1, 'Matrícula é obrigatória').max(255),
  telefone: z.string().min(1, 'Telefone é obrigatório').max(255),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').toUpperCase(),
  admissao: z.coerce.date(),
});

export const eletricistaLoteSchema = z.object({
  contratoId: z.number().int().positive('Contrato é obrigatório'),
  cargoId: z.number().int().positive('Cargo é obrigatório'),
  baseId: z.number().int().positive('Base é obrigatória'),
  // Status inicial para todos os eletricistas do lote (opcional, padrão ATIVO)
  status: z
    .enum([
      'ATIVO',
      'FERIAS',
      'LICENCA_MEDICA',
      'LICENCA_MATERNIDADE',
      'LICENCA_PATERNIDADE',
      'SUSPENSAO',
      'TREINAMENTO',
      'AFastADO',
      'DESLIGADO',
      'APOSENTADO',
    ])
    .optional()
    .default('ATIVO'),
  eletricistas: z
    .array(eletricistaLoteItemSchema)
    .min(1, 'Adicione pelo menos um eletricista'),
});

export type EletricistaCreate = z.infer<typeof eletricistaCreateSchema>;
export type EletricistaUpdate = z.infer<typeof eletricistaUpdateSchema>;
export type EletricistaFilter = z.infer<typeof eletricistaFilterSchema>;
export type EletricistaLoteInput = z.infer<typeof eletricistaLoteSchema>;
export type EletricistaLoteItem = z.infer<typeof eletricistaLoteItemSchema>;
