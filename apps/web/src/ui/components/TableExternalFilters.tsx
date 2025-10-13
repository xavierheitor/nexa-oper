/**
 * Componente de Filtros Externos para Tabelas
 *
 * Fornece filtros server-side reutilizáveis para serem usados
 * externamente às tabelas, permitindo filtragem precisa com
 * paginação e contadores corretos.
 *
 * FUNCIONALIDADES:
 * - Filtros server-side (processa no backend)
 * - Contadores precisos
 * - Busca integrada nos selects
 * - Reset automático de página ao filtrar
 * - Totalmente tipado
 *
 * EXEMPLO DE USO:
 * ```tsx
 * <TableExternalFilters
 *   filters={[
 *     {
 *       label: 'Base',
 *       placeholder: 'Filtrar por base',
 *       options: bases.map(b => ({ label: b.nome, value: b.id })),
 *       onChange: (value) => setParams(prev => ({ ...prev, baseId: value, page: 1 })),
 *       allowClear: true,
 *     },
 *     {
 *       label: 'Cargo',
 *       placeholder: 'Filtrar por cargo',
 *       options: cargos.map(c => ({ label: c.nome, value: c.id })),
 *       onChange: (value) => setParams(prev => ({ ...prev, cargoId: value, page: 1 })),
 *     }
 *   ]}
 * />
 * ```
 */

'use client';

import { Select, Space, Typography } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface FilterOption {
  label: string;
  value: number | string | null;
}

export interface ExternalFilter {
  label: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (value: any) => void;
  allowClear?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
}

interface TableExternalFiltersProps {
  filters: ExternalFilter[];
  style?: React.CSSProperties;
}

/**
 * Componente de filtros externos para tabelas
 *
 * Renderiza uma linha de selects para filtros server-side,
 * com busca integrada e comportamento consistente.
 */
export default function TableExternalFilters({ filters, style }: TableExternalFiltersProps) {
  if (!filters || filters.length === 0) {
    return null;
  }

  return (
    <Space
      style={{
        marginBottom: 16,
        width: '100%',
        flexWrap: 'wrap',
        ...style
      }}
      size="middle"
    >
      <FilterOutlined style={{ color: '#8c8c8c' }} />
      <Text type="secondary">Filtros:</Text>

      {filters.map((filter, index) => (
        <Select
          key={index}
          placeholder={filter.placeholder}
          style={{ minWidth: 200, ...filter.style }}
          onChange={filter.onChange}
          options={filter.options}
          allowClear={filter.allowClear ?? true}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          loading={filter.loading}
        />
      ))}
    </Space>
  );
}

