'use client';

import { Table, Button, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import type { TableFilters, TableSorter } from '@/lib/types/antd';
import { Falta } from '@/lib/schemas/turnoRealizadoSchema';
import StatusTag from './StatusTag';
import dayjs from 'dayjs';
import { EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface FaltaTableProps {
  faltas: Falta[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onTableChange?: (pagination: TablePaginationConfig, filters?: TableFilters, sorter?: TableSorter) => void;
  onJustificar?: (falta: Falta) => void;
  onVerDetalhes?: (falta: Falta) => void;
}

/**
 * Tabela de faltas com filtros e ações
 */
export default function FaltaTable({
  faltas,
  loading = false,
  pagination,
  onTableChange,
  onJustificar,
  onVerDetalhes,
}: FaltaTableProps) {
  const columns: ColumnsType<Falta> = [
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
      render: (_, record: Falta) =>
        `${record.eletricista.nome} (${record.eletricista.matricula})`,
      sorter: (a, b) => a.eletricista.nome.localeCompare(b.eletricista.nome),
    },
    {
      title: 'Equipe',
      dataIndex: ['equipe', 'nome'],
      key: 'equipe',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Falta) => {
        const justificativas = record.justificativas || record.Justificativas || [];
        const precisaJustificativa =
          (record.escalaSlotId !== null && record.escalaSlotId !== undefined) &&
          justificativas.length === 0 &&
          status === 'pendente';

        return (
          <Space>
            <StatusTag status={status} tipo="falta" />
            {precisaJustificativa && (
              <Tag color="orange" icon={<ExclamationCircleOutlined />}>
                Precisa Justificativa
              </Tag>
            )}
          </Space>
        );
      },
      filters: [
        { text: 'Pendente', value: 'pendente' },
        { text: 'Justificada', value: 'justificada' },
        { text: 'Indeferida', value: 'indeferida' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_, record: Falta) => (
        <Space>
          {onVerDetalhes && (
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onVerDetalhes(record)}
              size="small"
            >
              Ver
            </Button>
          )}
          {onJustificar && record.status === 'pendente' && (
            <Button
              type="link"
              onClick={() => onJustificar(record)}
              size="small"
            >
              Justificar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<Falta>
      columns={columns}
      dataSource={faltas}
      loading={loading}
      rowKey="id"
      pagination={
        pagination
          ? {
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} faltas`,
            }
          : false
      }
      // @ts-expect-error - TableFilters e TableSorter são tipos customizados compatíveis com o Ant Design
      onChange={onTableChange}
    />
  );
}

