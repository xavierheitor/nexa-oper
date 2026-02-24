'use client';

import { getApr } from '@/lib/actions/apr/get';
import { deleteApr } from '@/lib/actions/apr/delete';
import { getTextFilter } from '@/ui/components/tableFilters';
import { Apr } from '@nexa-oper/db';
import type { CrudController } from '@/lib/hooks/useCrudController';
import { Button, Card, Table, Tag } from 'antd';
import { useTableColumnsWithActions } from '@/lib/hooks/useTableColumnsWithActions';
import type { TableProps } from 'antd';

type UseEntityDataPaginated<T> = {
  data: T[];
  isLoading: boolean;
  error: unknown;
  mutate: () => void;
  pagination: TableProps<T>['pagination'];
  handleTableChange: TableProps<T>['onChange'];
};

interface AprTableProps {
  aprs: UseEntityDataPaginated<Apr>;
  controller: CrudController<Apr>;
}

export function AprTable({ aprs, controller }: AprTableProps) {
  const columns = useTableColumnsWithActions<Apr>(
    [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        width: 80,
      },
      {
        title: 'Nome da APR',
        dataIndex: 'nome',
        key: 'nome',
        sorter: true,
        ...getTextFilter<Apr>('nome', 'APR'),
      },
      {
        title: 'Grupos',
        key: 'grupos',
        width: 120,
        align: 'center' as const,
        render: (_, record: Apr & { AprGrupoRelacao?: unknown[] }) => {
          const count = record.AprGrupoRelacao?.length || 0;
          return <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>;
        },
        sorter: (a: Apr & { AprGrupoRelacao?: unknown[] }, b: Apr & { AprGrupoRelacao?: unknown[] }) => {
          const countA = a.AprGrupoRelacao?.length || 0;
          const countB = b.AprGrupoRelacao?.length || 0;
          return countA - countB;
        },
      },
      {
        title: 'Criado em',
        dataIndex: 'createdAt',
        key: 'createdAt',
        sorter: true,
        render: (date: Date) => new Date(date).toLocaleDateString('pt-BR'),
        width: 120,
      },
    ],
    {
      onEdit: async (item) => {
        const result = await getApr({ id: item.id });
        if (result.success && result.data) {
          controller.open(result.data);
        }
      },
      onDelete: (item) =>
        controller
          .exec(() => deleteApr({ id: item.id }), 'APR excluída com sucesso!')
          .finally(() => aprs.mutate()),
    }
  );

  return (
    <Card
      title="APRs (Análise Preliminar de Risco)"
      extra={
        <Button type="primary" onClick={() => controller.open()}>
          Adicionar APR
        </Button>
      }
    >
      <Table<Apr>
        columns={columns}
        dataSource={aprs.data}
        loading={aprs.isLoading}
        rowKey="id"
        pagination={aprs.pagination}
        onChange={aprs.handleTableChange}
        scroll={{ x: 800 }}
      />
    </Card>
  );
}
