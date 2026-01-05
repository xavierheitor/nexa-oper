/**
 * Tipos para Render Functions de Tabelas
 *
 * Este arquivo define tipos específicos para funções de renderização
 * de colunas de tabela do Ant Design, eliminando o uso de `any`.
 *
 * FUNCIONALIDADES:
 * - Tipos type-safe para render functions
 * - Compatibilidade com Ant Design Table
 * - Suporte a diferentes tipos de dados
 *
 * BENEFÍCIOS:
 * - Elimina uso de `(_: any, record: ...)` em render functions
 * - Type safety completo
 * - Melhor autocomplete e IntelliSense
 */

import type { ColumnsType } from 'antd/es/table';
import type React from 'react';

/**
 * Tipo para função de renderização de coluna de tabela
 *
 * @template TRecord - Tipo do registro da tabela
 * @template TValue - Tipo do valor da célula (opcional, inferido automaticamente)
 */
export type TableColumnRender<TRecord = unknown, TValue = unknown> = (
  value: TValue,
  record: TRecord,
  index: number
) => React.ReactNode;

/**
 * Tipo para função de renderização simplificada (sem index)
 *
 * @template TRecord - Tipo do registro da tabela
 * @template TValue - Tipo do valor da célula
 */
export type TableColumnRenderSimple<TRecord = unknown, TValue = unknown> = (
  value: TValue,
  record: TRecord
) => React.ReactNode;

/**
 * Tipo para função de renderização que ignora o valor
 * Útil quando apenas o record é necessário
 *
 * @template TRecord - Tipo do registro da tabela
 */
export type TableColumnRenderRecordOnly<TRecord = unknown> = (
  _: unknown,
  record: TRecord,
  index?: number
) => React.ReactNode;

/**
 * Tipo para função de renderização de filtro customizado
 */
export type TableFilterDropdownRender = (props: {
  setSelectedKeys: (keys: React.Key[]) => void;
  selectedKeys: React.Key[];
  confirm: () => void;
  clearFilters: () => void;
}) => React.ReactNode;

/**
 * Tipo para função de filtro customizado
 *
 * @template TRecord - Tipo do registro da tabela
 * @template TValue - Tipo do valor do filtro
 */
export type TableOnFilter<TRecord = unknown, TValue = unknown> = (
  value: TValue,
  record: TRecord
) => boolean;

/**
 * Tipo para função de sorter customizado
 *
 * @template TRecord - Tipo do registro da tabela
 */
export type TableSorterFunction<TRecord = unknown> = (
  a: TRecord,
  b: TRecord
) => number;

/**
 * Helper type para criar colunas type-safe
 *
 * @template TRecord - Tipo do registro da tabela
 */
export type TypedTableColumns<TRecord = unknown> = ColumnsType<TRecord>;

/**
 * Helper type para criar uma coluna com render function type-safe
 *
 * @template TRecord - Tipo do registro da tabela
 * @template TValue - Tipo do valor da coluna
 */
export interface TypedTableColumn<TRecord = unknown, TValue = unknown> {
  title: React.ReactNode;
  dataIndex?: keyof TRecord | string | string[];
  key?: string;
  render?: TableColumnRender<TRecord, TValue>;
  sorter?: boolean | TableSorterFunction<TRecord>;
  filterDropdown?: TableFilterDropdownRender;
  onFilter?: TableOnFilter<TRecord, TValue>;
  [key: string]: unknown;
}

