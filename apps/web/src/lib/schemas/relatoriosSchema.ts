/**
 * Schemas Zod para Relatórios
 *
 * Define validações para filtros e parâmetros dos relatórios
 */

import { z } from 'zod';

/**
 * Schema para filtros gerais de relatórios
 */
export const relatorioFiltroSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  baseId: z.number().int().positive().optional(),
  contratoId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  eletricistaId: z.number().int().positive().optional(),
});

export type RelatorioFiltro = z.infer<typeof relatorioFiltroSchema>;

/**
 * Schema específico para relatórios de veículos
 */
export const relatorioVeiculosFiltroSchema = relatorioFiltroSchema.extend({
  tipoVeiculoId: z.number().int().positive().optional(),
});

export type RelatorioVeiculosFiltro = z.infer<typeof relatorioVeiculosFiltroSchema>;

/**
 * Schema específico para relatórios de equipes
 */
export const relatorioEquipesFiltroSchema = relatorioFiltroSchema.extend({
  tipoEquipeId: z.number().int().positive().optional(),
  comHorario: z.boolean().optional(),
  escalada: z.boolean().optional(),
});

export type RelatorioEquipesFiltro = z.infer<typeof relatorioEquipesFiltroSchema>;

/**
 * Schema específico para relatórios de eletricistas
 */
export const relatorioEletricistasFiltroSchema = relatorioFiltroSchema.extend({
  cargoId: z.number().int().positive().optional(),
  estado: z.string().length(2).optional(),
});

export type RelatorioEletricistasFiltro = z.infer<typeof relatorioEletricistasFiltroSchema>;

/**
 * Schema específico para relatórios de escalas
 */
export const relatorioEscalasFiltroSchema = relatorioFiltroSchema.extend({
  status: z.enum(['RASCUNHO', 'EM_APROVACAO', 'PUBLICADA', 'ARQUIVADA']).optional(),
  tipoEscalaId: z.number().int().positive().optional(),
});

export type RelatorioEscalasFiltro = z.infer<typeof relatorioEscalasFiltroSchema>;

/**
 * Schema para relatório consolidado por base
 */
export const relatorioBaseFiltroSchema = z.object({
  contratoId: z.number().int().positive().optional().nullable(),
  baseId: z.number().int().positive().optional().nullable(),
  dataReferencia: z.string().optional().nullable(), // Data para verificar lotações vigentes
}).passthrough(); // Permite campos extras

export type RelatorioBaseFiltro = z.infer<typeof relatorioBaseFiltroSchema>;

