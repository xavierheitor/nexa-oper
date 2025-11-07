/**
 * Schemas Zod para Justificativas Individuais (Eletricista)
 *
 * Define validações para criar, listar e aprovar/rejeitar justificativas
 * de faltas individuais (atestado médico, falta pessoal, etc.)
 */

import { z } from 'zod';

/**
 * Schema para criar justificativa individual
 */
export const criarJustificativaSchema = z.object({
  faltaId: z.number().int().positive({ message: 'ID da falta é obrigatório' }),
  tipoJustificativaId: z.number().int().positive({ message: 'Tipo de justificativa é obrigatório' }),
  descricao: z.string().max(1000, { message: 'Descrição deve ter no máximo 1000 caracteres' }).optional(),
});

export type CriarJustificativaInput = z.infer<typeof criarJustificativaSchema>;

/**
 * Schema para aprovar justificativa individual
 */
export const aprovarJustificativaSchema = z.object({
  id: z.number().int().positive({ message: 'ID da justificativa é obrigatório' }),
  decididoPor: z.string().optional(), // Será preenchido automaticamente pelo session.user.id
});

export type AprovarJustificativaInput = z.infer<typeof aprovarJustificativaSchema>;

/**
 * Schema para rejeitar justificativa individual
 */
export const rejeitarJustificativaSchema = z.object({
  id: z.number().int().positive({ message: 'ID da justificativa é obrigatório' }),
  decididoPor: z.string().optional(), // Será preenchido automaticamente pelo session.user.id
});

export type RejeitarJustificativaInput = z.infer<typeof rejeitarJustificativaSchema>;

/**
 * Schema para listar justificativas individuais com filtros
 */
export const listarJustificativasSchema = z.object({
  eletricistaId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  status: z.enum(['pendente', 'aprovada', 'rejeitada']).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type ListarJustificativasInput = z.infer<typeof listarJustificativasSchema>;

/**
 * Schema para buscar justificativa individual por ID
 */
export const getJustificativaByIdSchema = z.object({
  id: z.number().int().positive({ message: 'ID da justificativa é obrigatório' }),
});

export type GetJustificativaByIdInput = z.infer<typeof getJustificativaByIdSchema>;

/**
 * Schema para buscar justificativas por falta
 */
export const getJustificativasByFaltaIdSchema = z.object({
  faltaId: z.number().int().positive({ message: 'ID da falta é obrigatório' }),
});

export type GetJustificativasByFaltaIdInput = z.infer<typeof getJustificativasByFaltaIdSchema>;

/**
 * Schema de resposta para justificativa individual
 */
export const justificativaResponseSchema = z.object({
  id: z.number(),
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
  faltas: z.array(z.object({
    id: z.number(),
    dataReferencia: z.date(),
    equipeId: z.number(),
    eletricistaId: z.number(),
    eletricista: z.object({
      id: z.number(),
      nome: z.string(),
      matricula: z.string(),
    }),
    status: z.string(),
  })),
});

export type JustificativaResponse = z.infer<typeof justificativaResponseSchema>;

