/**
 * Schemas Zod para Tipos de Justificativa
 *
 * Define validações para CRUD de tipos de justificativa
 */

import { z } from 'zod';

/**
 * Schema para criar tipo de justificativa
 */
export const criarTipoJustificativaSchema = z.object({
  nome: z.string().min(1, { message: 'Nome é obrigatório' }).max(255, { message: 'Nome deve ter no máximo 255 caracteres' }),
  descricao: z.string().max(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' }).optional(),
  ativo: z.boolean().default(true),
  geraFalta: z.boolean().default(true), // true = gera falta, false = conta como dia trabalhado
});

export type CriarTipoJustificativaInput = z.infer<typeof criarTipoJustificativaSchema>;

/**
 * Schema para atualizar tipo de justificativa
 */
export const atualizarTipoJustificativaSchema = z.object({
  id: z.number().int().positive({ message: 'ID do tipo é obrigatório' }),
  nome: z.string().min(1, { message: 'Nome é obrigatório' }).max(255, { message: 'Nome deve ter no máximo 255 caracteres' }).optional(),
  descricao: z.string().max(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' }).optional(),
  ativo: z.boolean().optional(),
  geraFalta: z.boolean().optional(),
});

export type AtualizarTipoJustificativaInput = z.infer<typeof atualizarTipoJustificativaSchema>;

/**
 * Schema para listar tipos de justificativa com filtros
 */
export const listarTiposJustificativaSchema = z.object({
  ativo: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type ListarTiposJustificativaInput = z.infer<typeof listarTiposJustificativaSchema>;

/**
 * Schema para buscar tipo de justificativa por ID
 */
export const getTipoJustificativaByIdSchema = z.object({
  id: z.number().int().positive({ message: 'ID do tipo é obrigatório' }),
});

export type GetTipoJustificativaByIdInput = z.infer<typeof getTipoJustificativaByIdSchema>;

/**
 * Schema de resposta para tipo de justificativa
 */
export const tipoJustificativaResponseSchema = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string().nullable(),
  ativo: z.boolean(),
  geraFalta: z.boolean(),
  createdAt: z.date(),
  createdBy: z.string(),
});

export type TipoJustificativaResponse = z.infer<typeof tipoJustificativaResponseSchema>;

