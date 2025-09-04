'use client'

import { Contrato } from '@nexa-oper/db';
import { Table } from 'antd';
import { listContratos } from '../../../lib/actions/contrato/list';
import { unwrapFetcher } from '../../../lib/db/helpers/unrapFetcher';
import { useEntityData } from '../../../lib/hooks/useEntityData';
import { useTableColumnsWithActions } from '../../../lib/hooks/useTableColumnsWithActions';

export default function ContratoPage() {
  const fetcher = unwrapFetcher(listContratos);

  const { data, total, pagination, handleTableChange, isLoading } = useEntityData<Contrato>({
    key: 'contratos',
    fetcher,
    paginationEnabled: true,
    initialParams: {
      page: 1,
      pageSize: 10,
      orderBy: 'id',
      orderDir: 'desc',
    },
  })

  const columns = useTableColumnsWithActions<Contrato>(
    [{
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
    }],
    {
      onEdit: (record) => {
        console.log(record);
      },
      onDelete: (record) => {
        console.log(record);
      },
    });

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={isLoading}
      pagination={pagination}
      onChange={handleTableChange}
      rowKey="id"
    />
  )
}