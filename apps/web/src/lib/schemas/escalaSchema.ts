/**
 * Schemas de Validação para Escalas
 *
 * Este módulo consolida todos os schemas Zod utilizados pelas Server Actions
 * e serviços relacionados ao domínio de Escalas. As validações cobrem desde
 * a criação/edição de escalas, definição de horários do ciclo, filtros de
 * listagem e atribuição de eletricistas aos turnos.
 *
 * PRINCIPAIS RESPONSABILIDADES:
 * - Garantir consistência dos dados enviados pelo frontend para o backend
 * - Documentar os campos esperados em cada operação
 * - Normalizar tipos (datas em ISO, números inteiros positivos etc.)
 * - Definir tipos TypeScript reutilizáveis derivados dos schemas
 *
 * COMO UTILIZAR:
 * ```ts
 * import {
 *   escalaCreateSchema,
 *   escalaAssignSchema,
 *   EscalaCreate,
 * } from '@/lib/schemas/escalaSchema';
 *
 * const payload: EscalaCreate = escalaCreateSchema.parse(formInput);
 * ```
 */

import { z } from 'zod';

/**
 * Schema base utilizado para configurar paginação e ordenação.
 *
 * A maior parte das listagens na aplicação segue o mesmo padrão de paginação,
 * portanto extraímos a definição para reaproveitamento dentro das operações
 * de Escala.
 */
const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  orderBy: z.string().default('id'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  include: z.any().optional(),
});

/**
 * Schema que descreve a estrutura de um horário dentro do ciclo da escala.
 */
export const escalaHorarioSchema = z.object({
  id: z.number().int().optional(),
  indiceCiclo: z
    .number({ required_error: 'Índice do ciclo é obrigatório' })
    .int('Índice precisa ser inteiro')
    .min(0, 'Índice do ciclo deve ser maior ou igual a zero'),
  diaSemana: z
    .number()
    .int('Dia da semana deve ser inteiro')
    .min(0, 'Dia da semana inválido')
    .max(6, 'Dia da semana inválido')
    .optional(),
  horaInicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/u, 'Horário deve estar no formato HH:mm')
    .nullable()
    .optional(),
  horaFim: z
    .string()
    .regex(/^\d{2}:\d{2}$/u, 'Horário deve estar no formato HH:mm')
    .nullable()
    .optional(),
  eletricistasNecessarios: z
    .number({ required_error: 'Quantidade de eletricistas é obrigatória' })
    .int('Quantidade de eletricistas deve ser inteira')
    .min(0, 'Quantidade de eletricistas não pode ser negativa'),
  folga: z.boolean().default(false),
  etiqueta: z
    .string()
    .max(64, 'Etiqueta deve ter no máximo 64 caracteres')
    .optional()
    .nullable(),
  rotacaoOffset: z
    .number()
    .int('Offset de rotação deve ser inteiro')
    .default(0)
    .optional(),
});

/**
 * Schema utilizado para criar uma nova escala.
 */
export const escalaCreateSchema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(191, 'Nome deve possuir no máximo 191 caracteres'),
  descricao: z
    .string()
    .trim()
    .max(5000, 'Descrição deve possuir no máximo 5000 caracteres')
    .optional()
    .nullable(),
  codigo: z
    .string()
    .trim()
    .max(64, 'Código deve possuir no máximo 64 caracteres')
    .optional()
    .nullable(),
  contratoId: z.number({ required_error: 'Contrato é obrigatório' }).int(),
  tipoVeiculo: z
    .enum(['CARRO', 'CAMINHAO', 'OUTRO'])
    .optional()
    .nullable(),
  diasCiclo: z
    .number({ required_error: 'Dias do ciclo são obrigatórios' })
    .int('Dias do ciclo deve ser inteiro')
    .min(1, 'Ciclo precisa ter pelo menos um dia'),
  minimoEletricistas: z
    .number({ required_error: 'Quantidade mínima é obrigatória' })
    .int('Quantidade mínima deve ser inteira')
    .min(1, 'Quantidade mínima precisa ser pelo menos 1'),
  maximoEletricistas: z
    .number()
    .int('Quantidade máxima deve ser inteira')
    .min(1, 'Quantidade máxima precisa ser pelo menos 1')
    .optional()
    .nullable(),
  inicioCiclo: z
    .string({ required_error: 'Data de início do ciclo é obrigatória' })
    .refine(value => !Number.isNaN(Date.parse(value)), 'Data de início inválida'),
  ativo: z.boolean().default(true).optional(),
  horarios: z
    .array(escalaHorarioSchema, { required_error: 'Cadastre pelo menos um horário' })
    .min(1, 'Cadastre pelo menos um horário para a escala'),
});

/**
 * Schema para atualização de escala. Herda as mesmas validações da criação
 * adicionando o identificador obrigatório.
 */
export const escalaUpdateSchema = escalaCreateSchema.extend({
  id: z.number({ required_error: 'ID da escala é obrigatório' }).int(),
});

/**
 * Schema de filtro utilizado na listagem de escalas.
 */
export const escalaFilterSchema = paginationSchema.extend({
  contratoId: z.number().int().optional(),
  ativo: z.boolean().optional(),
});

/**
 * Schema básico para operações que precisam apenas do identificador da escala.
 */
export const escalaIdSchema = z.object({
  id: z.number({ required_error: 'ID da escala é obrigatório' }).int(),
});

/**
 * Schema utilizado para atribuição de eletricistas aos horários.
 */
export const escalaAssignSchema = z.object({
  escalaId: z.number({ required_error: 'ID da escala é obrigatório' }).int(),
  alocacoes: z
    .array(
      z.object({
        horarioId: z
          .number({ required_error: 'ID do horário é obrigatório' })
          .int(),
        eletricistaId: z
          .number({ required_error: 'ID do eletricista é obrigatório' })
          .int(),
        ordemRotacao: z.number().int().default(0).optional(),
        vigenciaInicio: z
          .string()
          .refine(value => !value || !Number.isNaN(Date.parse(value)), 'Data inicial inválida')
          .optional()
          .nullable(),
        vigenciaFim: z
          .string()
          .refine(value => !value || !Number.isNaN(Date.parse(value)), 'Data final inválida')
          .optional()
          .nullable(),
        ativo: z.boolean().optional(),
      })
    )
    .optional()
    .default([]),
});

/**
 * Schema para geração de agenda da escala.
 */
export const escalaAgendaSchema = z.object({
  id: z.number({ required_error: 'ID da escala é obrigatório' }).int(),
  dataInicio: z
    .string()
    .refine(value => !value || !Number.isNaN(Date.parse(value)), 'Data inicial inválida')
    .optional()
    .nullable(),
  dataFim: z
    .string()
    .refine(value => !value || !Number.isNaN(Date.parse(value)), 'Data final inválida')
    .optional()
    .nullable(),
});

// Tipos TypeScript derivados dos schemas para reutilização
export type EscalaHorarioInput = z.infer<typeof escalaHorarioSchema>;
export type EscalaCreate = z.infer<typeof escalaCreateSchema>;
export type EscalaUpdate = z.infer<typeof escalaUpdateSchema>;
export type EscalaFilter = z.infer<typeof escalaFilterSchema>;
export type EscalaAssign = z.infer<typeof escalaAssignSchema>;
export type EscalaAgendaParams = z.infer<typeof escalaAgendaSchema>;
export type EscalaIdInput = z.infer<typeof escalaIdSchema>;
