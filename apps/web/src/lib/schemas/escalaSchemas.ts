/**
 * Schemas de Validação para Escalas
 *
 * Define regras de validação e tipos TypeScript para todas as
 * operações do módulo de escalas usando Zod.
 *
 * ENTIDADES COBERTAS:
 * - PapelEquipe
 * - TipoEscala (com ciclos e máscaras)
 * - ComposicaoMinimaTipoEscala
 * - EscalaEquipePeriodo
 * - EscalaEquipePeriodoComposicaoMinima
 * - SlotEscala
 * - AtribuicaoEletricista
 * - EquipeHorarioVigencia
 * - EventoCobertura
 * - RestricaoIndisponibilidade
 *
 * SCHEMAS ESPECIAIS:
 * - Geração de Slots
 * - Validações de composição
 * - Operações de cobertura
 */

import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

// ============================================
// ENUMS
// ============================================

export const ModoRepeticaoEnum = z.enum(['CICLO_DIAS', 'SEMANA_DEPENDENTE']);
export const DiaSemanaEnum = z.enum(['SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'DOMINGO']);
export const StatusTrabalhoEnum = z.enum(['TRABALHO', 'FOLGA']);
export const StatusEscalaEquipePeriodoEnum = z.enum(['RASCUNHO', 'EM_APROVACAO', 'PUBLICADA', 'ARQUIVADA']);
export const EstadoSlotEnum = z.enum(['TRABALHO', 'FOLGA', 'FALTA', 'EXCECAO']);
export const OrigemAtribuicaoEnum = z.enum(['GERACAO', 'MANUAL', 'REMANEJAMENTO']);
export const StatusAtribuicaoPlanejadaEnum = z.enum(['ATIVO', 'REMOVIDO']);
export const TipoIndisponibilidadeEnum = z.enum(['FERIAS', 'LICENCA', 'SUSPENSAO', 'MEDICO', 'TREINAMENTO', 'OUTRO']);
export const EventoCoberturaTipoEnum = z.enum(['FALTA', 'SUPRIMENTO', 'TROCA']);
export const EventoCoberturaResultadoEnum = z.enum(['COBERTO', 'VAGA_DESCOBERTA']);

// ============================================
// TIPO ESCALA
// ============================================

export const tipoEscalaCreateSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório').max(255),
    modoRepeticao: ModoRepeticaoEnum,
    cicloDias: z.number().int().positive().optional(),
    periodicidadeSemanas: z.number().int().positive().optional(),
    eletricistasPorTurma: z
      .number()
      .int()
      .min(1, 'Mínimo de 1 eletricista')
      .optional(),
    ativo: z.boolean().optional().default(true),
    observacoes: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      // Se CICLO_DIAS, cicloDias é obrigatório
      if (data.modoRepeticao === 'CICLO_DIAS') {
        return data.cicloDias != null && data.cicloDias > 0;
      }
      // Se SEMANA_DEPENDENTE, periodicidadeSemanas é obrigatório
      if (data.modoRepeticao === 'SEMANA_DEPENDENTE') {
        return (
          data.periodicidadeSemanas != null && data.periodicidadeSemanas > 0
        );
      }
      return true;
    },
    {
      message:
        'cicloDias é obrigatório para CICLO_DIAS e periodicidadeSemanas para SEMANA_DEPENDENTE',
      path: ['modoRepeticao'],
    }
  );

export const tipoEscalaUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    nome: z.string().min(1, 'Nome é obrigatório').max(255),
    modoRepeticao: ModoRepeticaoEnum,
    cicloDias: z.number().int().positive().optional(),
    periodicidadeSemanas: z.number().int().positive().optional(),
    eletricistasPorTurma: z
      .number()
      .int()
      .min(1, 'Mínimo de 1 eletricista')
      .optional(),
    ativo: z.boolean().optional().default(true),
    observacoes: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      if (data.modoRepeticao === 'CICLO_DIAS') {
        return data.cicloDias != null && data.cicloDias > 0;
      }
      if (data.modoRepeticao === 'SEMANA_DEPENDENTE') {
        return (
          data.periodicidadeSemanas != null && data.periodicidadeSemanas > 0
        );
      }
      return true;
    },
    {
      message:
        'cicloDias é obrigatório para CICLO_DIAS e periodicidadeSemanas para SEMANA_DEPENDENTE',
      path: ['modoRepeticao'],
    }
  );

export const tipoEscalaFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(10000).default(10),
  orderBy: z.string().default('nome'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
  ativo: z.boolean().optional(),
  modoRepeticao: ModoRepeticaoEnum.optional(),
  include: z.custom<IncludeConfig>().optional(),
});

// ============================================
// TIPO ESCALA - CICLO POSIÇÃO
// ============================================

export const tipoEscalaCicloPosicaoCreateSchema = z.object({
  tipoEscalaId: z.number().int().positive(),
  posicao: z.number().int().min(0),
  status: StatusTrabalhoEnum,
});

export const tipoEscalaCicloPosicaoUpdateSchema =
  tipoEscalaCicloPosicaoCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const salvarPosicoesCicloSchema = z.object({
  tipoEscalaId: z.number().int().positive(),
  posicoes: z
    .array(
      z.object({
        posicao: z.number().int().min(0),
        status: StatusTrabalhoEnum,
      })
    )
    .min(1, 'Pelo menos uma posição é necessária'),
});

export const salvarMascarasSemanasSchema = z.object({
  tipoEscalaId: z.number().int().positive(),
  mascaras: z
    .array(
      z.object({
        semanaIndex: z.number().int().min(0),
        dia: DiaSemanaEnum,
        status: StatusTrabalhoEnum,
      })
    )
    .min(1, 'Pelo menos uma máscara é necessária'),
});

// ============================================
// TIPO ESCALA - SEMANA MÁSCARA
// ============================================

export const tipoEscalaSemanaMascaraCreateSchema = z.object({
  tipoEscalaId: z.number().int().positive(),
  semanaIndex: z.number().int().min(0),
  dia: DiaSemanaEnum,
  status: StatusTrabalhoEnum,
});

export const tipoEscalaSemanaMascaraUpdateSchema =
  tipoEscalaSemanaMascaraCreateSchema.extend({
    id: z.number().int().positive(),
  });

// ============================================
// COMPOSIÇÃO MÍNIMA - TIPO ESCALA
// ============================================

export const composicaoMinimaTipoEscalaCreateSchema = z.object({
  tipoEscalaId: z.number().int().positive(),
  quantidadeMinima: z.number().int().min(0),
});

export const composicaoMinimaTipoEscalaUpdateSchema =
  composicaoMinimaTipoEscalaCreateSchema.extend({
    id: z.number().int().positive(),
  });

// ============================================
// ESCALA EQUIPE PERÍODO
// ============================================

export const escalaEquipePeriodoCreateSchema = z
  .object({
    equipeId: z.number().int().positive('Equipe é obrigatória'),
    periodoInicio: z.coerce.date(),
    periodoFim: z.coerce.date(),
    tipoEscalaId: z.number().int().positive('Tipo de escala é obrigatório'),
    observacoes: z.string().max(1000).nullish(), // Aceita null, undefined ou string
  })
  .refine(data => data.periodoFim >= data.periodoInicio, {
    message: 'Período fim deve ser maior ou igual ao período início',
    path: ['periodoFim'],
  });

export const escalaEquipePeriodoUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    equipeId: z.number().int().positive('Equipe é obrigatória'),
    periodoInicio: z.coerce.date(),
    periodoFim: z.coerce.date(),
    tipoEscalaId: z.number().int().positive('Tipo de escala é obrigatório'),
    observacoes: z.string().max(1000).nullish(), // Aceita null, undefined ou string
    status: StatusEscalaEquipePeriodoEnum.optional(),
    versao: z.number().int().positive().optional(),
  })
  .refine(data => data.periodoFim >= data.periodoInicio, {
    message: 'Período fim deve ser maior ou igual ao período início',
    path: ['periodoFim'],
  });

export const escalaEquipePeriodoFilterSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  equipeId: z.number().int().positive().optional(),
  tipoEscalaId: z.number().int().positive().optional(),
  tipoEquipeId: z.number().int().positive().optional(),
  baseId: z.number().int().positive().optional(),
  status: StatusEscalaEquipePeriodoEnum.optional(),
  periodoInicio: z.coerce.date().optional(),
  periodoFim: z.coerce.date().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

// ============================================
// ESCALA EQUIPE PERÍODO - COMPOSIÇÃO OVERRIDE
// ============================================

export const escalaEquipePeriodoComposicaoMinimaCreateSchema = z.object({
  escalaEquipePeriodoId: z.number().int().positive(),
  quantidadeMinima: z.number().int().min(0),
});

export const escalaEquipePeriodoComposicaoMinimaUpdateSchema =
  escalaEquipePeriodoComposicaoMinimaCreateSchema.extend({
    id: z.number().int().positive(),
  });

// ============================================
// SLOT ESCALA
// ============================================

export const slotEscalaCreateSchema = z
  .object({
    escalaEquipePeriodoId: z.number().int().positive(),
    data: z.coerce.date(),
    estado: EstadoSlotEnum,
    inicioPrevisto: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
    fimPrevisto: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
    anotacoesDia: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      // Se TRABALHO, horários devem ser preenchidos
      if (data.estado === 'TRABALHO') {
        return data.inicioPrevisto != null && data.fimPrevisto != null;
      }
      return true;
    },
    {
      message: 'Horários são obrigatórios quando o estado é TRABALHO',
      path: ['estado'],
    }
  );

export const slotEscalaUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    escalaEquipePeriodoId: z.number().int().positive(),
    data: z.coerce.date(),
    estado: EstadoSlotEnum,
    inicioPrevisto: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
    fimPrevisto: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
    anotacoesDia: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      if (data.estado === 'TRABALHO') {
        return data.inicioPrevisto != null && data.fimPrevisto != null;
      }
      return true;
    },
    {
      message: 'Horários são obrigatórios quando o estado é TRABALHO',
      path: ['estado'],
    }
  );

// ============================================
// ATRIBUIÇÃO ELETRICISTA
// ============================================

export const atribuicaoEletricistaCreateSchema = z.object({
  slotEscalaId: z.number().int().positive('Slot é obrigatório'),
  eletricistaId: z.number().int().positive('Eletricista é obrigatório'),
  origem: OrigemAtribuicaoEnum.optional().default('MANUAL'),
  statusPlanejado: StatusAtribuicaoPlanejadaEnum.optional().default('ATIVO'),
  observacoes: z.string().max(1000).optional(),
});

export const atribuicaoEletricistaUpdateSchema =
  atribuicaoEletricistaCreateSchema.extend({
    id: z.number().int().positive(),
  });

export const atribuicaoEletricistaBulkSchema = z.object({
  atribuicoes: z.array(atribuicaoEletricistaCreateSchema),
});

// ============================================
// HORÁRIO ABERTURA CATÁLOGO (Presets)
// ============================================

export const horarioAberturaCatalogoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255),
  inicioTurnoHora: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, 'Formato deve ser HH:MM:SS'),
  duracaoHoras: z.coerce.number().positive('Duração deve ser positiva'),
  duracaoIntervaloHoras: z.coerce
    .number()
    .min(0, 'Intervalo não pode ser negativo')
    .default(0),
  ativo: z.boolean().optional().default(true),
  observacoes: z.string().max(1000).nullish(), // Aceita null, undefined ou string
});

export const horarioAberturaCatalogoUpdateSchema = horarioAberturaCatalogoCreateSchema.extend({
  id: z.number().int().positive(),
});

export const horarioAberturaCatalogoFilterSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  ativo: z.boolean().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

// ============================================
// EQUIPE TURNO HISTÓRICO (Associação Equipe → Horário)
// ============================================

export const equipeTurnoHistoricoCreateSchema = z
  .object({
    equipeId: z.number().int().positive('Equipe é obrigatória'),
    horarioAberturaCatalogoId: z.number().int().positive().optional(),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date().nullable().optional(),
    inicioTurnoHora: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'Formato deve ser HH:MM:SS'),
    duracaoHoras: z.coerce.number().positive('Duração deve ser positiva'),
    duracaoIntervaloHoras: z.coerce.number().min(0).default(0),
    motivo: z.string().max(500).optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      // Se dataFim não existe, está ok
      if (!data.dataFim) return true;
      // Se dataInicio não é válida, não podemos comparar
      if (!(data.dataInicio instanceof Date) || isNaN(data.dataInicio.getTime())) return false;
      // Se dataFim não é válida, não podemos comparar
      if (!(data.dataFim instanceof Date) || isNaN(data.dataFim.getTime())) return false;
      // Comparar datas
      return data.dataFim >= data.dataInicio;
    },
    {
      message: 'Data fim deve ser maior ou igual à data início',
      path: ['dataFim'],
    }
  );

export const equipeTurnoHistoricoUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    equipeId: z.number().int().positive('Equipe é obrigatória'),
    horarioAberturaCatalogoId: z.number().int().positive().optional(),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date().nullable().optional(),
    inicioTurnoHora: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'Formato deve ser HH:MM:SS'),
    duracaoHoras: z.coerce.number().positive('Duração deve ser positiva'),
    duracaoIntervaloHoras: z.coerce.number().min(0).default(0),
    motivo: z.string().max(500).optional(),
    observacoes: z.string().max(1000).optional(),
  })
  .refine(
    data => {
      // Se dataFim não existe, está ok
      if (!data.dataFim) return true;
      // Se dataInicio não é válida, não podemos comparar
      if (!(data.dataInicio instanceof Date) || isNaN(data.dataInicio.getTime())) return false;
      // Se dataFim não é válida, não podemos comparar
      if (!(data.dataFim instanceof Date) || isNaN(data.dataFim.getTime())) return false;
      // Comparar datas
      return data.dataFim >= data.dataInicio;
    },
    {
      message: 'Data fim deve ser maior ou igual à data início',
      path: ['dataFim'],
    }
  );

export const equipeTurnoHistoricoFilterSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  equipeId: z.number().int().positive().optional(),
  vigente: z.boolean().optional(),
  include: z.custom<IncludeConfig>().optional(),
});

// ============================================
// EQUIPE HORÁRIO VIGÊNCIA (DEPRECATED - usar EquipeTurnoHistorico)
// ============================================

export const equipeHorarioVigenciaCreateSchema = z
  .object({
    equipeId: z.number().int().positive('Equipe é obrigatória'),
    inicioTurnoHora: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'Formato deve ser HH:MM:SS'),
    duracaoHoras: z.coerce.number().positive('Duração deve ser positiva'),
    vigenciaInicio: z.coerce.date(),
    vigenciaFim: z.coerce.date().optional(),
  })
  .refine(
    data => !data.vigenciaFim || data.vigenciaFim >= data.vigenciaInicio,
    {
      message: 'Vigência fim deve ser maior ou igual à vigência início',
      path: ['vigenciaFim'],
    }
  );

export const equipeHorarioVigenciaUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    equipeId: z.number().int().positive('Equipe é obrigatória'),
    inicioTurnoHora: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, 'Formato deve ser HH:MM:SS'),
    duracaoHoras: z.coerce.number().positive('Duração deve ser positiva'),
    vigenciaInicio: z.coerce.date(),
    vigenciaFim: z.coerce.date().optional(),
  })
  .refine(
    data => !data.vigenciaFim || data.vigenciaFim >= data.vigenciaInicio,
    {
      message: 'Vigência fim deve ser maior ou igual à vigência início',
      path: ['vigenciaFim'],
    }
  );

export const equipeHorarioVigenciaFilterSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  equipeId: z.number().int().positive().optional(),
  vigente: z.boolean().optional(), // Filtrar apenas vigências ativas
  include: z.custom<IncludeConfig>().optional(),
});

// ============================================
// EVENTO COBERTURA
// ============================================

export const eventoCoberturaCreateSchema = z.object({
  slotEscalaId: z.number().int().positive(),
  eletricistaPlanejadoId: z.number().int().positive().optional(),
  eletricistaCobrindoId: z.number().int().positive().optional(),
  tipo: EventoCoberturaTipoEnum,
  resultado: EventoCoberturaResultadoEnum,
  justificativa: z.string().max(1000).optional(),
  registradoEm: z.coerce.date().optional(),
});

export const eventoCoberturaUpdateSchema = eventoCoberturaCreateSchema.extend({
  id: z.number().int().positive(),
});

// ============================================
// SCHEMAS ESPECIAIS - AÇÕES
// ============================================

/**
 * Schema para geração de slots
 */
export const gerarSlotsSchema = z
  .object({
    escalaEquipePeriodoId: z
      .number()
      .int()
      .positive('ID do período é obrigatório'),
    mode: z.enum(['full', 'fromDate']),
    fromDate: z.coerce.date().optional(),
    eletricistasConfig: z
      .array(
        z.object({
          eletricistaId: z.number().int().positive(),
          eletricistaNome: z.string().optional(),
          primeiroDiaFolga: z.number().int().min(0),
        })
      )
      .optional(),
  })
  .refine(data => data.mode !== 'fromDate' || data.fromDate != null, {
    message: 'fromDate é obrigatório quando mode é fromDate',
    path: ['fromDate'],
  });

/**
 * Schema para publicar período
 */
export const publicarPeriodoSchema = z.object({
  escalaEquipePeriodoId: z.number().int().positive(),
  validarComposicao: z.boolean().optional().default(true),
});

/**
 * Schema para arquivar período
 */
export const arquivarPeriodoSchema = z.object({
  escalaEquipePeriodoId: z.number().int().positive(),
  motivo: z.string().max(1000).optional(),
});

/**
 * Schema para marcar falta
 */
export const marcarFaltaSchema = z
  .object({
    periodoId: z.number().int().positive('ID do período é obrigatório'),
    dataISO: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    eletricistaId: z.number().int().positive('ID do eletricista é obrigatório'),
    cobridorId: z.number().int().positive().optional(),
    justificativa: z.string().max(1000).optional(),
  })
  .describe('Marcar falta de eletricista');

/**
 * Schema para registrar troca
 */
export const registrarTrocaSchema = z
  .object({
    periodoId: z.number().int().positive('ID do período é obrigatório'),
    dataISO: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    titularId: z.number().int().positive('ID do titular é obrigatório'),
    executorId: z.number().int().positive('ID do executor é obrigatório'),
    justificativa: z.string().max(1000).optional(),
  })
  .describe('Registrar troca de turno');

/**
 * Schema para duplicar período
 */
export const duplicarPeriodoSchema = z
  .object({
    escalaEquipePeriodoId: z.number().int().positive(),
    novoPeriodoInicio: z.coerce.date(),
    novoPeriodoFim: z.coerce.date(),
    copiarAtribuicoes: z.boolean().optional().default(false),
  })
  .refine(data => data.novoPeriodoFim >= data.novoPeriodoInicio, {
    message: 'Novo período fim deve ser maior ou igual ao novo período início',
    path: ['novoPeriodoFim'],
  });

/**
 * Schema para prolongar período de escala
 */
export const prolongarPeriodoSchema = z
  .object({
    escalaEquipePeriodoId: z.number().int().positive(),
    novoPeriodoFim: z.coerce.date(),
  });

/**
 * Schema para validar composição mínima
 */
export const validarComposicaoSchema = z.object({
  slotEscalaId: z.number().int().positive(),
  atribuicoes: z.array(
    z.object({
      quantidade: z.number().int().min(0),
    })
  ),
});

/**
 * Schema para atribuição automática de eletricistas
 */
export const atribuirEletricistasSchema = z.object({
  escalaEquipePeriodoId: z
    .number()
    .int()
    .positive('ID do período é obrigatório'),
  eletricistas: z
    .array(
      z.object({
        eletricistaId: z
          .number()
          .int()
          .positive('ID do eletricista é obrigatório'),
        proximaFolga: z.coerce.date(),
      })
    )
    .min(2, 'Mínimo de 2 eletricistas necessário'),
});

// ============================================
// EXPORTAÇÃO DE TIPOS
// ============================================

// TipoEscala
export type TipoEscalaCreate = z.infer<typeof tipoEscalaCreateSchema>;
export type TipoEscalaUpdate = z.infer<typeof tipoEscalaUpdateSchema>;
export type TipoEscalaFilter = z.infer<typeof tipoEscalaFilterSchema>;

// TipoEscalaCicloPosicao
export type TipoEscalaCicloPosicaoCreate = z.infer<
  typeof tipoEscalaCicloPosicaoCreateSchema
>;
export type TipoEscalaCicloPosicaoUpdate = z.infer<
  typeof tipoEscalaCicloPosicaoUpdateSchema
>;
export type SalvarPosicoesCiclo = z.infer<typeof salvarPosicoesCicloSchema>;
export type SalvarMascarasSemanas = z.infer<typeof salvarMascarasSemanasSchema>;

// TipoEscalaSemanaMascara
export type TipoEscalaSemanaMascaraCreate = z.infer<
  typeof tipoEscalaSemanaMascaraCreateSchema
>;
export type TipoEscalaSemanaMascaraUpdate = z.infer<
  typeof tipoEscalaSemanaMascaraUpdateSchema
>;

// ComposicaoMinimaTipoEscala
export type ComposicaoMinimaTipoEscalaCreate = z.infer<
  typeof composicaoMinimaTipoEscalaCreateSchema
>;
export type ComposicaoMinimaTipoEscalaUpdate = z.infer<
  typeof composicaoMinimaTipoEscalaUpdateSchema
>;

// EscalaEquipePeriodo
export type EscalaEquipePeriodoCreate = z.infer<
  typeof escalaEquipePeriodoCreateSchema
>;
export type EscalaEquipePeriodoUpdate = z.infer<
  typeof escalaEquipePeriodoUpdateSchema
>;
export type EscalaEquipePeriodoFilter = z.infer<
  typeof escalaEquipePeriodoFilterSchema
>;

// EscalaEquipePeriodoComposicaoMinima
export type EscalaEquipePeriodoComposicaoMinimaCreate = z.infer<
  typeof escalaEquipePeriodoComposicaoMinimaCreateSchema
>;
export type EscalaEquipePeriodoComposicaoMinimaUpdate = z.infer<
  typeof escalaEquipePeriodoComposicaoMinimaUpdateSchema
>;

// SlotEscala
export type SlotEscalaCreate = z.infer<typeof slotEscalaCreateSchema>;
export type SlotEscalaUpdate = z.infer<typeof slotEscalaUpdateSchema>;

// AtribuicaoEletricista
export type AtribuicaoEletricistaCreate = z.infer<
  typeof atribuicaoEletricistaCreateSchema
>;
export type AtribuicaoEletricistaUpdate = z.infer<
  typeof atribuicaoEletricistaUpdateSchema
>;
export type AtribuicaoEletricistaBulk = z.infer<
  typeof atribuicaoEletricistaBulkSchema
>;

// HorarioAberturaCatalogo
export type HorarioAberturaCatalogoCreate = z.infer<
  typeof horarioAberturaCatalogoCreateSchema
>;
export type HorarioAberturaCatalogoUpdate = z.infer<
  typeof horarioAberturaCatalogoUpdateSchema
>;
export type HorarioAberturaCatalogoFilter = z.infer<
  typeof horarioAberturaCatalogoFilterSchema
>;

// EquipeTurnoHistorico
export type EquipeTurnoHistoricoCreate = z.infer<
  typeof equipeTurnoHistoricoCreateSchema
>;
export type EquipeTurnoHistoricoUpdate = z.infer<
  typeof equipeTurnoHistoricoUpdateSchema
>;
export type EquipeTurnoHistoricoFilter = z.infer<
  typeof equipeTurnoHistoricoFilterSchema
>;

// EquipeHorarioVigencia (DEPRECATED)
export type EquipeHorarioVigenciaCreate = z.infer<
  typeof equipeHorarioVigenciaCreateSchema
>;
export type EquipeHorarioVigenciaUpdate = z.infer<
  typeof equipeHorarioVigenciaUpdateSchema
>;
export type EquipeHorarioVigenciaFilter = z.infer<
  typeof equipeHorarioVigenciaFilterSchema
>;

// EventoCobertura
export type EventoCoberturaCreate = z.infer<typeof eventoCoberturaCreateSchema>;
export type EventoCoberturaUpdate = z.infer<typeof eventoCoberturaUpdateSchema>;

// Actions
export type GerarSlotsInput = z.infer<typeof gerarSlotsSchema>;
export type PublicarPeriodoInput = z.infer<typeof publicarPeriodoSchema>;
export type ArquivarPeriodoInput = z.infer<typeof arquivarPeriodoSchema>;
export type DuplicarPeriodoInput = z.infer<typeof duplicarPeriodoSchema>;
export type ProlongarPeriodoInput = z.infer<typeof prolongarPeriodoSchema>;

/**
 * Schema para transferir escala entre eletricistas
 */
export const transferirEscalaSchema = z
  .object({
    escalaEquipePeriodoId: z.number().int().positive(),
    eletricistaOrigemId: z.number().int().positive(),
    eletricistaDestinoId: z.number().int().positive(),
    dataInicio: z.coerce.date(),
  });

export type TransferirEscalaInput = z.infer<typeof transferirEscalaSchema>;
export type AtribuirEletricistasInput = z.infer<
  typeof atribuirEletricistasSchema
>;
export type ValidarComposicaoInput = z.infer<typeof validarComposicaoSchema>;
export type MarcarFaltaInput = z.infer<typeof marcarFaltaSchema>;
export type RegistrarTrocaInput = z.infer<typeof registrarTrocaSchema>;
