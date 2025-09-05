/**
 * Utilitários para Filtros de Tabela Ant Design
 *
 * Este módulo fornece funções utilitárias para criar filtros padronizados
 * em colunas de tabelas do Ant Design, incluindo filtros de texto, seleção,
 * datas e números com interface consistente.
 *
 * FUNCIONALIDADES:
 * - Filtro de texto com busca case-insensitive
 * - Filtro de seleção com opções customizadas
 * - Filtro de data com range picker
 * - Filtro numérico com range de valores
 * - Interface consistente em toda aplicação
 * - Type safety completo com TypeScript
 *
 * BENEFÍCIOS:
 * - Reutilização em múltiplas tabelas
 * - Interface padronizada
 * - Fácil implementação
 * - Flexibilidade para casos específicos
 * - Performance otimizada
 *
 * EXEMPLO DE USO:
 * ```tsx
 * import { getTextFilter, getSelectFilter } from '@/ui/components/tableFilters';
 *
 * const columns = [
 *   {
 *     title: 'Nome',
 *     dataIndex: 'nome',
 *     key: 'nome',
 *     ...getTextFilter('nome', 'nome do contrato'),
 *   },
 *   {
 *     title: 'Status',
 *     dataIndex: 'status',
 *     key: 'status',
 *     ...getSelectFilter('status', [
 *       { text: 'Ativo', value: 'ativo' },
 *       { text: 'Inativo', value: 'inativo' }
 *     ]),
 *   }
 * ];
 * ```
 */

'use client';

import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, InputNumber } from 'antd';
import { ColumnFilterItem } from 'antd/es/table/interface';
import type { Key } from 'react';
import React from 'react';

const { RangePicker } = DatePicker;

/**
 * Cria filtro de texto para colunas
 *
 * Gera um filtro de busca textual case-insensitive com
 * interface padronizada incluindo input de busca e botões.
 *
 * @param dataIndex - Campo do objeto a ser filtrado
 * @param placeholder - Texto do placeholder do input
 * @returns Propriedades do filtro para a coluna
 */
export const getTextFilter = <T,>(
  dataIndex: keyof T,
  placeholder: string
) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Buscar ${placeholder}`}
        value={selectedKeys[0]}
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8, display: 'block' }}
        autoFocus
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button
          type="primary"
          onClick={() => confirm()}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90 }}
        >
          Buscar
        </Button>
        <Button
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
          size="small"
          style={{ width: 90 }}
        >
          Limpar
        </Button>
      </div>
    </div>
  ),
  filterIcon: (filtered: boolean) => (
    <SearchOutlined style={{ color: filtered ? '#1677ff' : '#8c8c8c' }} />
  ),
  onFilter: (value: boolean | Key, record: T) => {
    const fieldValue = record[dataIndex];
    return fieldValue
      ? fieldValue.toString().toLowerCase().includes(value.toString().toLowerCase())
      : false;
  },
});

/**
 * Cria filtro de seleção para colunas
 * 
 * Gera um filtro de seleção múltipla com opções predefinidas
 * para campos com valores limitados (status, categorias, etc.).
 * 
 * @param dataIndex - Campo do objeto a ser filtrado
 * @param options - Array de opções para o filtro
 * @returns Propriedades do filtro para a coluna
 */
export const getSelectFilter = <T,>(
  dataIndex: keyof T,
  options: ColumnFilterItem[]
) => ({
  filters: options,
  onFilter: (value: boolean | Key, record: T) => {
    const fieldValue = record[dataIndex];
    return fieldValue === value;
  },
  filterMultiple: true,
});

/**
 * Cria filtro numérico com range para colunas
 * 
 * Gera um filtro de valores numéricos com inputs para
 * valor mínimo e máximo.
 * 
 * @param dataIndex - Campo do objeto a ser filtrado
 * @param placeholder - Texto base para os placeholders
 * @returns Propriedades do filtro para a coluna
 */
export const getNumberRangeFilter = <T,>(
  dataIndex: keyof T,
  placeholder: string
) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
    const [min, max] = selectedKeys[0]?.split('-') || ['', ''];

    const handleChange = (type: 'min' | 'max', value: number | null) => {
      const currentMin = type === 'min' ? value : min;
      const currentMax = type === 'max' ? value : max;

      if (currentMin !== undefined && currentMax !== undefined) {
        const rangeValue = `${currentMin || ''}-${currentMax || ''}`;
        setSelectedKeys(rangeValue ? [rangeValue] : []);
      }
    };

    return (
      <div style={{ padding: 8 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <InputNumber
            placeholder={`Min ${placeholder}`}
            value={min ? Number(min) : undefined}
            onChange={(value) => handleChange('min', value)}
            style={{ flex: 1 }}
          />
          <InputNumber
            placeholder={`Max ${placeholder}`}
            value={max ? Number(max) : undefined}
            onChange={(value) => handleChange('max', value)}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <Button
            type="primary"
            onClick={() => confirm()}
            size="small"
            style={{ width: 90 }}
          >
            Filtrar
          </Button>
          <Button
            onClick={() => {
              clearFilters?.();
              confirm();
            }}
            size="small"
            style={{ width: 90 }}
          >
            Limpar
          </Button>
        </div>
      </div>
    );
  },
  onFilter: (value: string, record: T) => {
    const [minStr, maxStr] = value.split('-');
    const min = minStr ? Number(minStr) : null;
    const max = maxStr ? Number(maxStr) : null;
    const fieldValue = Number(record[dataIndex]);

    if (min !== null && max !== null) {
      return fieldValue >= min && fieldValue <= max;
    } else if (min !== null) {
      return fieldValue >= min;
    } else if (max !== null) {
      return fieldValue <= max;
    }
    return true;
  },
});

/**
 * Cria filtro de data com range para colunas
 * 
 * Gera um filtro de datas com seletor de período
 * para filtrar registros por intervalo de datas.
 * 
 * @param dataIndex - Campo do objeto a ser filtrado
 * @param placeholder - Texto para o placeholder
 * @returns Propriedades do filtro para a coluna
 */
export const getDateRangeFilter = <T,>(
  dataIndex: keyof T,
  placeholder: string
) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
    <div style={{ padding: 8 }}>
      <RangePicker
        placeholder={[`${placeholder} inicial`, `${placeholder} final`]}
        value={selectedKeys[0]}
        onChange={(dates) => setSelectedKeys(dates ? [dates] : [])}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Button
          type="primary"
          onClick={() => confirm()}
          size="small"
          style={{ width: 90 }}
        >
          Filtrar
        </Button>
        <Button
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
          size="small"
          style={{ width: 90 }}
        >
          Limpar
        </Button>
      </div>
    </div>
  ),
  onFilter: (value: any, record: T) => {
    if (!value || !value[0] || !value[1]) return true;

    const [startDate, endDate] = value;
    const fieldValue = new Date(record[dataIndex] as string);

    return fieldValue >= startDate && fieldValue <= endDate;
  },
});

/**
 * Cria filtro customizado com componente personalizado
 * 
 * Permite criar filtros completamente customizados com
 * qualquer componente React.
 * 
 * @param component - Componente React para o filtro
 * @param onFilter - Função de filtro customizada
 * @returns Propriedades do filtro para a coluna
 */
export const getCustomFilter = <T,>(
  component: React.ComponentType<any>,
  onFilter: (value: any, record: T) => boolean
) => ({
  filterDropdown: (props: any) => React.createElement(component, props),
  onFilter,
});

/**
 * Exemplo de uso completo com múltiplos tipos de filtros:
 * 
 * ```tsx
 * import { 
 *   getTextFilter, 
 *   getSelectFilter, 
 *   getNumberRangeFilter,
 *   getDateRangeFilter 
 * } from '@/lib/utils/tableFilters';
 * 
 * const columns = [
 *   {
 *     title: 'Nome',
 *     dataIndex: 'nome',
 *     key: 'nome',
 *     sorter: true,
 *     ...getTextFilter('nome', 'nome do contrato'),
 *   },
 *   {
 *     title: 'Status',
 *     dataIndex: 'status',
 *     key: 'status',
 *     ...getSelectFilter('status', [
 *       { text: 'Ativo', value: 'ativo' },
 *       { text: 'Inativo', value: 'inativo' },
 *       { text: 'Pendente', value: 'pendente' }
 *     ]),
 *   },
 *   {
 *     title: 'Valor',
 *     dataIndex: 'valor',
 *     key: 'valor',
 *     sorter: true,
 *     ...getNumberRangeFilter('valor', 'valor'),
 *     render: (value: number) => value.toLocaleString('pt-BR', {
 *       style: 'currency',
 *       currency: 'BRL'
 *     }),
 *   },
 *   {
 *     title: 'Data Criação',
 *     dataIndex: 'createdAt',
 *     key: 'createdAt',
 *     sorter: true,
 *     ...getDateRangeFilter('createdAt', 'data'),
 *     render: (date: string) => new Date(date).toLocaleDateString('pt-BR'),
 *   }
 * ];
 * ```
 */
