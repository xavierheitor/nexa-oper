import { z } from 'zod';
import type { IncludeConfig } from '../types/common';

/**
 * Schema para filtro de ChecklistPendencia
 */
export const checklistPendenciaFilterSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  orderBy: z.string(),
  orderDir: z.enum(['asc', 'desc']),
  search: z.string().optional(),
  include: z.custom<IncludeConfig>().optional(),
  status: z.enum(['AGUARDANDO_TRATAMENTO', 'EM_TRATAMENTO', 'TRATADA', 'REGISTRO_INCORRETO']).optional(),
  turnoId: z.number().int().positive().optional(),
  checklistPreenchidoId: z.number().int().positive().optional(),
});

/**
 * Schema para atualização de ChecklistPendencia
 */
export const checklistPendenciaUpdateSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['AGUARDANDO_TRATAMENTO', 'EM_TRATAMENTO', 'TRATADA', 'REGISTRO_INCORRETO']).optional(),
  observacaoTratamento: z.string().optional(),
  tratadoPor: z.string().optional(),
  tratadoEm: z.union([z.date(), z.string()]).optional(),
});

/**
 * Schema para obter ChecklistPendencia por ID
 */
export const checklistPendenciaGetSchema = z.object({
  id: z.number().int().positive(),
});


