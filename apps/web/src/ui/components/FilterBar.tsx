/**
 * Componente de Barra de Filtros Reutilizável
 *
 * Este componente fornece uma barra de filtros configurável e reutilizável,
 * eliminando código repetitivo de filtros em múltiplas páginas.
 *
 * FUNCIONALIDADES:
 * - Suporte a múltiplos tipos de filtros (Select, Input, DatePicker, RangePicker)
 * - Layout responsivo com Space do Ant Design
 * - Botão de limpar filtros
 * - Loading states para selects
 * - Type safety completo
 *
 * BENEFÍCIOS:
 * - Elimina código repetitivo de filtros
 * - Padroniza aparência de filtros
 * - Facilita manutenção
 * - Layout consistente
 *
 * EXEMPLO DE USO:
 * ```typescript
 * <FilterBar
 *   filters={[
 *     {
 *       type: 'select',
 *       key: 'contratoId',
 *       placeholder: 'Filtrar por Contrato',
 *       options: contratosOptions,
 *       loading: loadingContratos,
 *       style: { width: 250 }
 *     },
 *     {
 *       type: 'select',
 *       key: 'baseId',
 *       placeholder: 'Filtrar por Base',
 *       options: basesOptions,
 *       loading: loadingBases,
 *       style: { width: 250 }
 *     }
 *   ]}
 *   values={filtros}
 *   onChange={handleFilterChange}
 *   onClear={handleClearFilters}
 * />
 * ```
 */

'use client';

import React from 'react';
import { Space, Select, Input, DatePicker, Button } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { SelectOption, SelectOptionValue } from '@/lib/types/selectOptions';
import type { FilterValue } from '@/lib/types/filters';

const { RangePicker } = DatePicker;

/**
 * Configuração de um filtro individual
 *
 * @template TValue - Tipo do valor do filtro (para selects)
 */
export interface FilterConfig<TValue extends SelectOptionValue = SelectOptionValue> {
  /**
   * Tipo do filtro
   */
  type: 'select' | 'input' | 'date' | 'dateRange';

  /**
   * Chave do filtro (usada no objeto de valores)
   */
  key: string;

  /**
   * Placeholder do filtro
   */
  placeholder?: string;

  /**
   * Opções para select
   */
  options?: SelectOption<TValue>[];

  /**
   * Loading state para select
   */
  loading?: boolean;

  /**
   * Estilo customizado
   */
  style?: React.CSSProperties;

  /**
   * Largura do filtro
   */
  width?: number | string;

  /**
   * Se deve permitir limpar o filtro
   */
  allowClear?: boolean;
}

/**
 * Props do componente
 */
export interface FilterBarProps {
  /**
   * Array de configurações de filtros
   */
  filters: FilterConfig[];

  /**
   * Valores atuais dos filtros
   */
  values: Record<string, FilterValue>;

  /**
   * Handler para mudança de filtro
   */
  onChange: (key: string, value: FilterValue) => void;

  /**
   * Handler para limpar todos os filtros
   */
  onClear?: () => void;

  /**
   * Label do botão de limpar
   * @default 'Limpar Filtros'
   */
  clearLabel?: string;

  /**
   * Se deve mostrar o botão de limpar
   * @default true
   */
  showClearButton?: boolean;

  /**
   * Tamanho do espaço entre filtros
   * @default 'middle'
   */
  size?: 'small' | 'middle' | 'large';

  /**
   * Se deve quebrar linha quando necessário
   * @default true
   */
  wrap?: boolean;
}

/**
 * Componente de barra de filtros reutilizável
 */
export default function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  clearLabel = 'Limpar Filtros',
  showClearButton = true,
  size = 'middle',
  wrap = true,
}: FilterBarProps) {
  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key];
    const style = filter.width
      ? { ...filter.style, width: filter.width }
      : filter.style || { width: 250 };

    switch (filter.type) {
      case 'select':
        return (
          <Select
            key={filter.key}
            placeholder={filter.placeholder}
            style={style}
            allowClear={filter.allowClear ?? true}
            loading={filter.loading}
            value={value && value !== null && value !== undefined && typeof value !== 'boolean' ? (value as SelectOptionValue) : undefined}
            onChange={(newValue) => onChange(filter.key, (newValue ?? null) as FilterValue)}
            options={filter.options}
          />
        );

      case 'input':
        return (
          <Input
            key={filter.key}
            placeholder={filter.placeholder}
            style={style}
            allowClear={filter.allowClear ?? true}
            value={value as string | undefined}
            onChange={(e) => onChange(filter.key, e.target.value)}
          />
        );

      case 'date':
        return (
          <DatePicker
            key={filter.key}
            placeholder={filter.placeholder}
            style={style}
            allowClear={filter.allowClear ?? true}
            value={value && (typeof value === 'string' || value instanceof Date) && typeof value !== 'boolean' ? dayjs(value) : null}
            onChange={(date) => onChange(filter.key, date ? date.toISOString() : null)}
          />
        );

      case 'dateRange':
        return (
          <RangePicker
            key={filter.key}
            style={style}
            value={
              value && Array.isArray(value) && value.length === 2
                ? [
                  value[0] && (typeof value[0] === 'string' || (typeof value[0] === 'object' && value[0] !== null && !Array.isArray(value[0]) && 'getTime' in value[0])) ? dayjs(value[0] as string | Date) : null,
                  value[1] && (typeof value[1] === 'string' || (typeof value[1] === 'object' && value[1] !== null && !Array.isArray(value[1]) && 'getTime' in value[1])) ? dayjs(value[1] as string | Date) : null,
                ]
                : null
            }
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                const dateArray: [string, string] = [dates[0].toISOString(), dates[1].toISOString()];
                onChange(filter.key, dateArray as unknown as FilterValue);
              } else {
                onChange(filter.key, null);
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Space wrap={wrap} size={size}>
      {filters.map(renderFilter)}
      {showClearButton && onClear && (
        <Button icon={<ClearOutlined />} onClick={onClear}>
          {clearLabel}
        </Button>
      )}
    </Space>
  );
}

