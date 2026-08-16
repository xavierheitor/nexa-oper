import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

const filterBase = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  orderBy: z.string().min(1),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

export const inspecaoSegurancaTipoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  chave: z.string().min(1, 'Chave é obrigatória').max(100),
  contexto: z.enum(['GERAL', 'COLABORADOR', 'EPC', 'VEICULO']).default('GERAL'),
  descricao: z.string().max(500).optional().nullable(),
  contratoId: z.number().int().positive().optional().nullable(),
  ativo: z.boolean().optional().default(true),
});

export const inspecaoSegurancaTipoUpdateSchema =
  inspecaoSegurancaTipoCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const inspecaoSegurancaPerguntaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  obrigatoria: z.boolean().optional().default(true),
  ativo: z.boolean().optional().default(true),
});

export const inspecaoSegurancaPerguntaUpdateSchema =
  inspecaoSegurancaPerguntaCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const inspecaoSegurancaOpcaoRespostaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  geraPendencia: z.boolean().optional().default(false),
  exigeFoto: z.boolean().optional().default(false),
  ativo: z.boolean().optional().default(true),
});

export const inspecaoSegurancaOpcaoRespostaUpdateSchema =
  inspecaoSegurancaOpcaoRespostaCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const inspecaoSegurancaGrupoPerguntaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  tipoResposta: z.enum(['opcao', 'checkbox', 'texto', 'numero']).default('opcao'),
  perguntaIds: z.array(z.number().int().positive()).optional().default([]),
  opcaoRespostaIds: z.array(z.number().int().positive()).optional().default([]),
  ativo: z.boolean().optional().default(true),
});

export const inspecaoSegurancaGrupoPerguntaUpdateSchema =
  inspecaoSegurancaGrupoPerguntaCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const inspecaoSegurancaModeloCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  descricao: z.string().max(500).optional().nullable(),
  tipoId: z.number().int().positive('Tipo é obrigatório'),
  contratoId: z.number().int().positive().optional().nullable(),
  grupoPerguntaIds: z.array(z.number().int().positive()).optional().default([]),
  ativo: z.boolean().optional().default(true),
});

export const inspecaoSegurancaModeloUpdateSchema =
  inspecaoSegurancaModeloCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const inspecaoSegurancaFilterSchema = filterBase;

export const inspecaoSegurancaGetSchema = z.object({
  id: z.number().int().positive(),
});

export const inspecaoSegurancaDeleteSchema = z.object({
  id: z.number().int().positive(),
});

export type InspecaoSegurancaTipoCreate = z.infer<typeof inspecaoSegurancaTipoCreateSchema>;
export type InspecaoSegurancaTipoUpdate = z.infer<typeof inspecaoSegurancaTipoUpdateSchema>;
export type InspecaoSegurancaPerguntaCreate = z.infer<typeof inspecaoSegurancaPerguntaCreateSchema>;
export type InspecaoSegurancaPerguntaUpdate = z.infer<typeof inspecaoSegurancaPerguntaUpdateSchema>;
export type InspecaoSegurancaOpcaoRespostaCreate = z.infer<typeof inspecaoSegurancaOpcaoRespostaCreateSchema>;
export type InspecaoSegurancaOpcaoRespostaUpdate = z.infer<typeof inspecaoSegurancaOpcaoRespostaUpdateSchema>;
export type InspecaoSegurancaGrupoPerguntaCreate = z.infer<typeof inspecaoSegurancaGrupoPerguntaCreateSchema>;
export type InspecaoSegurancaGrupoPerguntaUpdate = z.infer<typeof inspecaoSegurancaGrupoPerguntaUpdateSchema>;
export type InspecaoSegurancaModeloCreate = z.infer<typeof inspecaoSegurancaModeloCreateSchema>;
export type InspecaoSegurancaModeloUpdate = z.infer<typeof inspecaoSegurancaModeloUpdateSchema>;
export type InspecaoSegurancaFilter = z.infer<typeof inspecaoSegurancaFilterSchema>;
