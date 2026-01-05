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
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Configuração de um filtro individual
 */
export interface FilterConfig {
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
  options?: Array<{ label: string; value: any }>;

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
  values: Record<string, any>;

  /**
   * Handler para mudança de filtro
   */
  onChange: (key: string, value: any) => void;

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
            value={value}
            onChange={(newValue) => onChange(filter.key, newValue)}
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
            value={value}
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
            value={value ? dayjs(value) : null}
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
                ? [value[0] ? dayjs(value[0]) : null, value[1] ? dayjs(value[1]) : null]
                : null
            }
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                onChange(filter.key, [dates[0].toISOString(), dates[1].toISOString()]);
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

