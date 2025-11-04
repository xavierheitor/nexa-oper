/**
 * Schema de Status de Eletricista
 *
 * Este schema define as validações para o sistema de status de eletricistas,
 * permitindo rastrear se estão trabalhando, afastados, de férias, etc.
 *
 * @author Sistema Nexa Oper
 * @date 2025-01-04
 * @version 1.0
 */

import { z } from 'zod';

// Enum de status de eletricista
export const StatusEletricistaEnum = z.enum([
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
]);

/**
 * Schema para registrar mudança de status
 */
export const registrarStatusSchema = z.object({
  eletricistaId: z.number().int().positive('ID do eletricista é obrigatório'),
  status: StatusEletricistaEnum,
  dataInicio: z.coerce.date().optional().default(() => new Date()),
  dataFim: z.coerce.date().optional(),
  motivo: z.string().max(500, 'Motivo deve ter no máximo 500 caracteres').optional(),
  observacoes: z.string().max(1000, 'Observações devem ter no máximo 1000 caracteres').optional(),
  documentoPath: z.string().max(1000, 'Caminho do documento deve ter no máximo 1000 caracteres').optional(),
});

/**
 * Schema para atualizar status (com validações adicionais)
 */
export const atualizarStatusSchema = registrarStatusSchema.extend({
  id: z.number().int().positive('ID do status é obrigatório'),
});

/**
 * Schema para filtros de busca de status
 */
export const statusFiltroSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('dataInicio'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  eletricistaId: z.number().int().positive().optional(),
  status: StatusEletricistaEnum.optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

/**
 * Schema para listar eletricistas por status
 */
export const eletricistasPorStatusSchema = z.object({
  status: StatusEletricistaEnum,
  dataReferencia: z.coerce.date().optional().default(() => new Date()),
});

/**
 * Schema para listar eletricistas afastados em um período
 */
export const eletricistasAfastadosSchema = z.object({
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
});

/**
 * Schema para histórico de status
 */
export const historicoStatusSchema = z.object({
  eletricistaId: z.number().int().positive('ID do eletricista é obrigatório'),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

// Tipos TypeScript exportados
export type StatusEletricista = z.infer<typeof StatusEletricistaEnum>;
export type RegistrarStatusInput = z.infer<typeof registrarStatusSchema>;
export type AtualizarStatusInput = z.infer<typeof atualizarStatusSchema>;
export type StatusFiltro = z.infer<typeof statusFiltroSchema>;
export type EletricistasPorStatusInput = z.infer<typeof eletricistasPorStatusSchema>;
export type EletricistasAfastadosInput = z.infer<typeof eletricistasAfastadosSchema>;
export type HistoricoStatusInput = z.infer<typeof historicoStatusSchema>;

// Labels para exibição
export const StatusEletricistaLabels: Record<StatusEletricista, string> = {
  ATIVO: 'Ativo (Trabalhando)',
  FERIAS: 'Férias',
  LICENCA_MEDICA: 'Licença Médica',
  LICENCA_MATERNIDADE: 'Licença Maternidade',
  LICENCA_PATERNIDADE: 'Licença Paternidade',
  SUSPENSAO: 'Suspensão',
  TREINAMENTO: 'Treinamento',
  AFastADO: 'Afastado',
  DESLIGADO: 'Desligado',
  APOSENTADO: 'Aposentado',
};

// Cores para badges (sugestão)
export const StatusEletricistaColors: Record<StatusEletricista, string> = {
  ATIVO: 'green',
  FERIAS: 'orange',
  LICENCA_MEDICA: 'blue',
  LICENCA_MATERNIDADE: 'purple',
  LICENCA_PATERNIDADE: 'purple',
  SUSPENSAO: 'red',
  TREINAMENTO: 'cyan',
  AFastADO: 'yellow',
  DESLIGADO: 'default',
  APOSENTADO: 'default',
};

