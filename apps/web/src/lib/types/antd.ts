/**
 * Tipos auxiliares para eventos e componentes do Ant Design
 *
 * Este arquivo centraliza tipos TypeScript para eventos e props do Ant Design,
 * evitando o uso de `any` e garantindo type safety.
 */

import type { UploadChangeParam, UploadFile } from 'antd/es/upload';
import type { TablePaginationConfig } from 'antd/es/table';
import type { TableProps } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import type { Rule } from 'antd/es/form';

// ========================================
// TYPES FOR UPLOAD COMPONENT
// ========================================

/**
 * Tipo para o evento onChange do componente Upload
 */
export type UploadChangeEvent = UploadChangeParam<UploadFile>;

/**
 * Tipo para o callback onChange do Upload
 */
export type UploadChangeHandler = (info: UploadChangeEvent) => void;

// ========================================
// TYPES FOR TABLE COMPONENT
// ========================================

/**
 * Tipo para filtros de tabela do Ant Design
 */
export type TableFilters = Record<string, (string | number | boolean)[] | null>;

/**
 * Tipo para sorter de tabela do Ant Design
 */
export type TableSorter = {
  field?: string | number | readonly (string | number)[];
  order?: 'ascend' | 'descend';
  column?: {
    sorter?: boolean;
    [key: string]: unknown;
  };
} | {
  field?: string | number | readonly (string | number)[];
  order?: 'ascend' | 'descend';
  column?: {
    sorter?: boolean;
    [key: string]: unknown;
  };
}[];

/**
 * Tipo para o evento onChange da Table
 */
export type TableChangeEvent<T = unknown> = (
  pagination: TablePaginationConfig,
  filters: TableFilters,
  sorter: TableSorter,
  extra: TableProps<T>['onChange'] extends (...args: unknown[]) => unknown
    ? Parameters<NonNullable<TableProps<T>['onChange']>>[3]
    : never
) => void;

/**
 * Tipo simplificado para paginação de tabela
 */
export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Tipo para o callback onChange da Table (versão simplificada)
 */
export type TableChangeHandler = (
  pagination: TablePaginationConfig,
  filters?: TableFilters,
  sorter?: TableSorter
) => void;

// ========================================
// TYPES FOR FORM COMPONENT
// ========================================

/**
 * Tipo para valores de formulário do Ant Design
 */
export type FormValues = Record<string, unknown>;

/**
 * Tipo para o callback de validação customizada do Form.Item
 */
export type FormValidator = (
  rule: Rule,
  value: unknown
) => Promise<void> | void;

/**
 * Tipo para valores de DatePicker (Dayjs)
 */
export type DatePickerValue = Dayjs | null | undefined;

/**
 * Tipo para valores de formulário que incluem DatePicker
 */
export interface FormValuesWithDates extends FormValues {
  dataInicio?: DatePickerValue;
  dataFim?: DatePickerValue;
  [key: string]: unknown;
}

// ========================================
// TYPES FOR SELECT COMPONENT
// ========================================

/**
 * Tipo para opções de Select
 */
export interface SelectOption<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}

// ========================================
// TYPES FOR RENDER FUNCTIONS
// ========================================

/**
 * Tipo para função render de coluna de tabela
 */
export type TableRenderFunction<T = unknown> = (
  value: unknown,
  record: T,
  index: number
) => React.ReactNode;

// ========================================
// TYPES FOR ERROR HANDLING
// ========================================

/**
 * Tipo para erros em catch blocks
 */
export type ErrorType = Error | unknown;

/**
 * Helper para extrair mensagem de erro de forma type-safe
 */
export function getErrorMessage(error: ErrorType): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Erro desconhecido';
}

