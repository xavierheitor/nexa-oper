/**
 * Schemas Zod para Justificativas de Equipe
 *
 * Define validações para criar, listar e aprovar/rejeitar justificativas
 * quando equipes não abrem turno (ex: veículo quebrado, falta de reposição)
 */

import { z } from 'zod';

/**
 * Schema para criar justificativa de equipe
 */
export const criarJustificativaEquipeSchema = z.object({
  equipeId: z.number().int().positive({ message: 'ID da equipe é obrigatório' }),
  dataReferencia: z.string().datetime({ message: 'Data de referência inválida' }),
  tipoJustificativaId: z.number().int().positive({ message: 'Tipo de justificativa é obrigatório' }),
  descricao: z.string().max(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' }).optional(),
});

export type CriarJustificativaEquipeInput = z.infer<typeof criarJustificativaEquipeSchema>;

/**
 * Schema para aprovar justificativa de equipe
 */
export const aprovarJustificativaEquipeSchema = z.object({
  id: z.number().int().positive({ message: 'ID da justificativa é obrigatório' }),
  decididoPor: z.string().optional(), // Será preenchido automaticamente pelo session.user.id
});

export type AprovarJustificativaEquipeInput = z.infer<typeof aprovarJustificativaEquipeSchema>;

/**
 * Schema para rejeitar justificativa de equipe
 */
export const rejeitarJustificativaEquipeSchema = z.object({
  id: z.number().int().positive({ message: 'ID da justificativa é obrigatório' }),
  decididoPor: z.string().optional(), // Será preenchido automaticamente pelo session.user.id
});

export type RejeitarJustificativaEquipeInput = z.infer<typeof rejeitarJustificativaEquipeSchema>;

/**
 * Schema para listar justificativas de equipe com filtros
 */
export const listarJustificativasEquipeSchema = z.object({
  equipeId: z.number().int().positive().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  status: z.enum(['pendente', 'aprovada', 'rejeitada']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type ListarJustificativasEquipeInput = z.infer<typeof listarJustificativasEquipeSchema>;

/**
 * Schema para buscar justificativa de equipe por ID
 */
export const getJustificativaEquipeByIdSchema = z.object({
  id: z.number().int().positive({ message: 'ID da justificativa é obrigatório' }),
});

export type GetJustificativaEquipeByIdInput = z.infer<typeof getJustificativaEquipeByIdSchema>;

/**
 * Schema de resposta para justificativa de equipe
 */
export const justificativaEquipeResponseSchema = z.object({
  id: z.number(),
  dataReferencia: z.date(),
  equipeId: z.number(),
  equipe: z.object({
    id: z.number(),
    nome: z.string(),
  }),
  tipoJustificativaId: z.number(),
  tipoJustificativa: z.object({
    id: z.number(),
    nome: z.string(),
    descricao: z.string().nullable(),
    geraFalta: z.boolean(),
  }),
  descricao: z.string().nullable(),
  status: z.enum(['pendente', 'aprovada', 'rejeitada']),
  createdAt: z.date(),
  createdBy: z.string(),
  decidedBy: z.string().nullable(),
  decidedAt: z.date().nullable(),
});

export type JustificativaEquipeResponse = z.infer<typeof justificativaEquipeResponseSchema>;

