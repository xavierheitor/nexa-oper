'use client';

import { Table, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import type { TableFilters, TableSorter } from '@/lib/types/antd';
import { HoraExtra } from '@/lib/schemas/turnoRealizadoSchema';
import StatusTag from './StatusTag';
import TipoHoraExtraTag from './TipoHoraExtraTag';
import dayjs from 'dayjs';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

interface HoraExtraTableProps {
  horasExtras: HoraExtra[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onTableChange?: (pagination: TablePaginationConfig, filters?: TableFilters, sorter?: TableSorter) => void;
  onAprovar?: (horaExtra: HoraExtra) => void;
  onRejeitar?: (horaExtra: HoraExtra) => void;
}

/**
 * Tabela de horas extras com filtros e ações
 */
export default function HoraExtraTable({
  horasExtras,
  loading = false,
  pagination,
  onTableChange,
  onAprovar,
  onRejeitar,
}: HoraExtraTableProps) {
  const columns: ColumnsType<HoraExtra> = [
    {
      title: 'Data',
      dataIndex: 'dataReferencia',
      key: 'dataReferencia',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => a.dataReferencia.getTime() - b.dataReferencia.getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Eletricista',
      key: 'eletricista',
      render: (_, record: HoraExtra) =>
        `${record.eletricista.nome} (${record.eletricista.matricula})`,
      sorter: (a, b) => a.eletricista.nome.localeCompare(b.eletricista.nome),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => <TipoHoraExtraTag tipo={tipo} />,
      filters: [
        { text: 'Folga Trabalhada', value: 'folga_trabalhada' },
        { text: 'Trabalho Extrafora', value: 'extrafora' },
        { text: 'Atraso Compensado', value: 'atraso_compensado' },
        { text: 'Troca de Folga', value: 'troca_folga' },
      ],
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: 'Horas Previstas',
      dataIndex: 'horasPrevistas',
      key: 'horasPrevistas',
      render: (horas: number | null) => (horas ? `${horas.toFixed(1)}h` : '-'),
      align: 'right',
    },
    {
      title: 'Horas Realizadas',
      dataIndex: 'horasRealizadas',
      key: 'horasRealizadas',
      render: (horas: number) => `${horas.toFixed(1)}h`,
      align: 'right',
    },
    {
      title: 'Diferença',
      dataIndex: 'diferencaHoras',
      key: 'diferencaHoras',
      render: (diferenca: number) => (
        <span style={{ color: diferenca > 0 ? '#3f8600' : '#cf1322' }}>
          {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)}h
        </span>
      ),
      align: 'right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag status={status} tipo="horaExtra" />,
      filters: [
        { text: 'Pendente', value: 'pendente' },
        { text: 'Aprovada', value: 'aprovada' },
        { text: 'Rejeitada', value: 'rejeitada' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record: HoraExtra) => (
        <Space>
          {onAprovar && record.status === 'pendente' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => onAprovar(record)}
              size="small"
              style={{ color: '#3f8600' }}
            >
              Aprovar
            </Button>
          )}
          {onRejeitar && record.status === 'pendente' && (
            <Button
              type="link"
              icon={<CloseOutlined />}
              onClick={() => onRejeitar(record)}
              size="small"
              danger
            >
              Rejeitar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<HoraExtra>
      columns={columns}
      dataSource={horasExtras}
      loading={loading}
      rowKey="id"
      pagination={
        pagination
          ? {
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} horas extras`,
            }
          : false
      }
      onChange={onTableChange}
    />
  );
}

