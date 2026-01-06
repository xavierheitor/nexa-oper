import { z } from 'zod';

/**
 * Schemas para validação de dados de turnos realizados e frequência
 */

// ============================================
// ENUMS
// ============================================

export const PeriodoTipoEnum = z.enum(['mes', 'trimestre', 'custom']);

export const FaltaStatusEnum = z.enum(['pendente', 'justificada', 'indeferida']);

export const HoraExtraTipoEnum = z.enum([
  'folga_trabalhada',
  'extrafora',
  'atraso_compensado',
  'troca_folga',
]);

export const HoraExtraStatusEnum = z.enum(['pendente', 'aprovada', 'rejeitada']);

export const AcaoAprovacaoEnum = z.enum(['aprovar', 'rejeitar']);

// ============================================
// FILTROS
// ============================================

export const periodoSchema = z.object({
  periodo: PeriodoTipoEnum.optional().default('custom'),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
});

export const faltaFilterSchema = z.object({
  eletricistaId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  status: FaltaStatusEnum.optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
});

export const horaExtraFilterSchema = z.object({
  eletricistaId: z.number().int().positive().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  tipo: HoraExtraTipoEnum.optional(),
  status: HoraExtraStatusEnum.optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
});

export const aprovarHoraExtraSchema = z.object({
  acao: AcaoAprovacaoEnum,
  observacoes: z.string().max(1000).optional(),
});

// ============================================
// RESPONSES
// ============================================

export const eletricistaBasicoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  matricula: z.string(),
});

export const equipeBasicaSchema = z.object({
  id: z.number(),
  nome: z.string(),
});

export const periodoResponseSchema = z.object({
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
});

export const resumoEletricistaSchema = z.object({
  diasTrabalhados: z.number(),
  diasEscalados: z.number(),
  faltas: z.number(),
  faltasJustificadas: z.number(),
  faltasPendentes: z.number(),
  horasExtras: z.number(),
  horasExtrasAprovadas: z.number(),
  horasExtrasPendentes: z.number(),
  atrasos: z.number(),
  divergenciasEquipe: z.number(),
});

export const detalhamentoDiaSchema = z.object({
  data: z.coerce.date(),
  // ✅ CORREÇÃO: Adicionar novos tipos para mostrar escala e o que aconteceu
  tipo: z.enum([
    'trabalho',           // Compatibilidade (antigo)
    'trabalho_realizado', // Trabalho realizado em dia de escala TRABALHO
    'escala_trabalho',    // Escala prevista: TRABALHO
    'escala_folga',       // Escala prevista: FOLGA
    'falta',              // Falta em dia de escala TRABALHO
    'hora_extra',         // Hora extra (folga trabalhada, extrafora, etc.)
    'folga',              // Compatibilidade (antigo - folga sem trabalho)
  ]),
  horasPrevistas: z.number(),
  horasRealizadas: z.number(),
  status: z.string(),
  faltaId: z.number().optional(),
  horaExtraId: z.number().optional(),
  tipoHoraExtra: HoraExtraTipoEnum.optional(),
  equipe: equipeBasicaSchema.optional(), // Equipe em que trabalhou
  horaInicio: z.coerce.date().optional(), // Hora de início do turno
  horaFim: z.coerce.date().optional(), // Hora de fim do turno
  slotId: z.number().optional(), // ID do slot de escala (para escala_trabalho/escala_folga)
  turnoId: z.number().optional(), // ID do turno realizado
});

export const consolidadoEletricistaResponseSchema = z.object({
  eletricista: eletricistaBasicoSchema,
  periodo: periodoResponseSchema,
  resumo: resumoEletricistaSchema,
  detalhamento: z.array(detalhamentoDiaSchema),
  diasComEscala: z.array(z.string()).optional(), // Lista de datas (YYYY-MM-DD) que têm escala
});

export const resumoEletricistaEquipeSchema = z.object({
  diasTrabalhados: z.number(),
  faltas: z.number(),
  horasExtras: z.number(),
});

export const eletricistaResumoEquipeSchema = z.object({
  eletricista: eletricistaBasicoSchema,
  resumo: resumoEletricistaEquipeSchema,
});

export const consolidadoEquipeResponseSchema = z.object({
  equipe: equipeBasicaSchema,
  periodo: periodoResponseSchema,
  eletricistas: z.array(eletricistaResumoEquipeSchema),
});

// ============================================
// FALTA
// ============================================

export const justificativaBasicaSchema = z.object({
  id: z.number(),
  status: z.string(),
  descricao: z.string().nullable(),
});

export const faltaJustificativaSchema = z.object({
  id: z.number(),
  justificativa: justificativaBasicaSchema,
});

export const faltaSchema = z.object({
  id: z.number(),
  dataReferencia: z.coerce.date(),
  eletricista: eletricistaBasicoSchema,
  equipe: equipeBasicaSchema,
  motivoSistema: z.string(),
  status: FaltaStatusEnum,
  escalaSlotId: z.number().nullable().optional(),
  Justificativas: z.array(faltaJustificativaSchema).optional().default([]),
  justificativas: z.array(faltaJustificativaSchema).optional().default([]),
  createdAt: z.coerce.date(),
});

export const faltaListResponseSchema = z.object({
  data: z.array(faltaSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// ============================================
// HORA EXTRA
// ============================================

export const horaExtraSchema = z.object({
  id: z.number(),
  dataReferencia: z.coerce.date(),
  eletricista: eletricistaBasicoSchema,
  tipo: HoraExtraTipoEnum,
  horasPrevistas: z.number().nullable(),
  horasRealizadas: z.number(),
  diferencaHoras: z.number(),
  status: HoraExtraStatusEnum,
  observacoes: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const horaExtraListResponseSchema = z.object({
  data: z.array(horaExtraSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const aprovarHoraExtraResponseSchema = z.object({
  id: z.number(),
  status: HoraExtraStatusEnum,
  updatedAt: z.coerce.date().nullable(),
  updatedBy: z.string().nullable(),
});

// ============================================
// TIPOS TYPESCRIPT
// ============================================

export type PeriodoTipo = z.infer<typeof PeriodoTipoEnum>;
export type FaltaStatus = z.infer<typeof FaltaStatusEnum>;
export type HoraExtraTipo = z.infer<typeof HoraExtraTipoEnum>;
export type HoraExtraStatus = z.infer<typeof HoraExtraStatusEnum>;
export type AcaoAprovacao = z.infer<typeof AcaoAprovacaoEnum>;

export type Periodo = z.infer<typeof periodoSchema>;
export type FaltaFilter = z.infer<typeof faltaFilterSchema>;
export type HoraExtraFilter = z.infer<typeof horaExtraFilterSchema>;
export type AprovarHoraExtra = z.infer<typeof aprovarHoraExtraSchema>;

export type ConsolidadoEletricistaResponse = z.infer<
  typeof consolidadoEletricistaResponseSchema
>;
export type ConsolidadoEquipeResponse = z.infer<typeof consolidadoEquipeResponseSchema>;
export type FaltaListResponse = z.infer<typeof faltaListResponseSchema>;
export type HoraExtraListResponse = z.infer<typeof horaExtraListResponseSchema>;
export type AprovarHoraExtraResponse = z.infer<typeof aprovarHoraExtraResponseSchema>;

export type DetalhamentoDia = z.infer<typeof detalhamentoDiaSchema>;
export type Falta = z.infer<typeof faltaSchema>;
export type HoraExtra = z.infer<typeof horaExtraSchema>;

// ============================================
// LABELS E CORES (para UI)
// ============================================

export const PeriodoTipoLabels: Record<PeriodoTipo, string> = {
  mes: 'Mês Atual',
  trimestre: 'Trimestre Atual',
  custom: 'Período Customizado',
};

export const FaltaStatusLabels: Record<FaltaStatus, string> = {
  pendente: 'Pendente',
  justificada: 'Justificada',
  indeferida: 'Indeferida',
};

export const FaltaStatusColors: Record<FaltaStatus, string> = {
  pendente: 'orange',
  justificada: 'green',
  indeferida: 'red',
};

export const HoraExtraTipoLabels: Record<HoraExtraTipo, string> = {
  folga_trabalhada: 'Folga Trabalhada',
  extrafora: 'Trabalho Extrafora',
  atraso_compensado: 'Atraso Compensado',
  troca_folga: 'Troca de Folga',
};

export const HoraExtraStatusLabels: Record<HoraExtraStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
};

export const HoraExtraStatusColors: Record<HoraExtraStatus, string> = {
  pendente: 'orange',
  aprovada: 'green',
  rejeitada: 'red',
};

