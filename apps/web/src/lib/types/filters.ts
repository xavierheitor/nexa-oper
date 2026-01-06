/**
 * Tipos Genéricos para Filtros
 *
 * Este arquivo define tipos genéricos e reutilizáveis para filtros,
 * eliminando o uso de `any` em valores de filtros.
 *
 * FUNCIONALIDADES:
 * - Tipos genéricos baseados em entidades
 * - Type safety para valores de filtros
 * - Suporte a filtros complexos e aninhados
 *
 * BENEFÍCIOS:
 * - Elimina uso de `any` em filtros
 * - Type safety completo
 * - Facilita manutenção e refatoração
 */

import type { PaginationParams } from './common';

/**
 * Tipo para valores de filtro comuns
 */
export type FilterValue = string | number | boolean | Date | string[] | null | undefined;

/**
 * Tipo para arrays de valores de filtro
 */
export type FilterValueArray = Array<FilterValue>;

/**
 * Tipo para range de valores (usado em date ranges, number ranges, etc.)
 */
export type FilterRange<T = FilterValue> = [T | null, T | null];

/**
 * Interface base para filtros genéricos
 */
export interface BaseEntityFilter extends PaginationParams {
  /** Campo de busca textual */
  search?: string;
  /** Campos específicos da entidade para filtro */
  [key: string]: FilterValue | FilterValueArray | FilterRange | PaginationParams[keyof PaginationParams] | undefined;
}

/**
 * Tipo para filtros de relatórios
 * Permite filtros flexíveis com type safety
 */
export interface ReportFilter extends PaginationParams {
  /** ID do contrato */
  contratoId?: number;
  /** ID da base */
  baseId?: number;
  /** ID do tipo de equipe */
  tipoEquipeId?: number;
  /** ID da equipe */
  equipeId?: number;
  /** ID do veículo */
  veiculoId?: number;
  /** ID do eletricista */
  eletricistaId?: number;
  /** Data de início do período */
  dataInicio?: Date | string;
  /** Data de fim do período */
  dataFim?: Date | string;
  /** Campos adicionais específicos do relatório */
  [key: string]: FilterValue | FilterValueArray | FilterRange | PaginationParams[keyof PaginationParams] | undefined;
}

/**
 * Tipo para filtros de localização
 */
export interface LocationFilter extends PaginationParams {
  tipoEquipeId?: number;
  baseId?: number;
  equipeId?: number;
  dataInicio?: Date | string;
  dataFim?: Date | string;
}

/**
 * Tipo para filtros de escalas
 */
export interface EscalaFilter extends PaginationParams {
  equipeId?: number;
  tipoEscalaId?: number;
  status?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
}

/**
 * Tipo para filtros de turnos
 */
export interface TurnoFilter extends PaginationParams {
  veiculoId?: number;
  equipeId?: number;
  baseId?: number;
  tipoEquipeId?: number;
  status?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
}

/**
 * Tipo para filtros de checklists
 */
export interface ChecklistFilter extends PaginationParams {
  checklistId?: number;
  tipoChecklistId?: number;
  tipoEquipeId?: number;
  veiculoId?: number;
  baseId?: number;
  status?: string;
  dataInicio?: Date | string;
  dataFim?: Date | string;
}

