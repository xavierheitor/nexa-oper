'use client';

import { Table, Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Falta } from '@/lib/schemas/turnoRealizadoSchema';
import StatusTag from './StatusTag';
import dayjs from 'dayjs';
import { EyeOutlined } from '@ant-design/icons';

interface FaltaTableProps {
  faltas: Falta[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onTableChange?: (pagination: any) => void;
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
      render: (status: string) => <StatusTag status={status} tipo="falta" />,
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
      onChange={onTableChange}
    />
  );
}

